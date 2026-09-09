from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
import random

from app.database import get_db
from app.models import User, Achievement, UserAchievement, UserProgress, MysteryBoxReward
from app.schemas import (
    LeaderboardEntry, AchievementResponse, MysteryBoxOpenRequest, MysteryBoxOpenResponse
)
from app.security import get_current_user, get_current_user_optional

router = APIRouter(prefix="/gamification", tags=["Gamification & Economy"])


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    # Calculate stars for users
    subquery = (
        select(UserProgress.user_id, func.sum(UserProgress.stars).label("total_stars"))
        .group_by(UserProgress.user_id)
        .subquery()
    )

    query = (
        select(User, func.coalesce(subquery.c.total_stars, 0).label("stars"))
        .outerjoin(subquery, User.id == subquery.c.user_id)
        .order_by(User.xp.desc(), User.level.desc())
        .limit(50)
    )

    result = await db.execute(query)
    rows = result.all()

    leaderboard = []
    for rank, (u, stars) in enumerate(rows, 1):
        leaderboard.append(
            LeaderboardEntry(
                rank=rank,
                user_id=u.id,
                username=u.username,
                avatar=u.avatar,
                level=u.level,
                xp=u.xp,
                stars=int(stars),
                streak=u.streak
            )
        )
    return leaderboard


@router.get("/achievements", response_model=List[AchievementResponse])
async def list_achievements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    res = await db.execute(select(Achievement))
    achievements = res.scalars().all()

    unlocked_map = {}
    if current_user:
        ua_res = await db.execute(
            select(UserAchievement).where(UserAchievement.user_id == current_user.id)
        )
        for ua in ua_res.scalars().all():
            unlocked_map[ua.achievement_id] = ua.unlocked_at

    response = []
    for ach in achievements:
        unlocked = ach.id in unlocked_map
        response.append(
            AchievementResponse(
                id=ach.id,
                code=ach.code,
                title=ach.title,
                description=ach.description,
                icon=ach.icon,
                category=ach.category,
                xp_bonus=ach.xp_bonus,
                coin_bonus=ach.coin_bonus,
                unlocked=unlocked,
                unlocked_at=unlocked_map.get(ach.id)
            )
        )
    return response


@router.post("/mystery-box/open", response_model=MysteryBoxOpenResponse)
async def open_mystery_box(
    req: MysteryBoxOpenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    costs = {
        "BRONZE": 50,
        "SILVER": 120,
        "CYBER_GOLD": 250
    }
    box_type = req.box_type.upper()
    cost = costs.get(box_type, 50)

    if current_user.coins < cost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient coins! A {box_type} Box costs {cost} coins. You have {current_user.coins}."
        )

    current_user.coins -= cost

    # Determine loot
    roll = random.random()
    if box_type == "BRONZE":
        if roll < 0.40:
            reward_type = "XP"
            val = random.choice([100, 150, 200])
            current_user.xp += val
            display = f"+{val} Cyber XP"
        elif roll < 0.70:
            reward_type = "COINS"
            val = random.choice([60, 75, 90])
            current_user.coins += val
            display = f"+{val} Cyber Coins"
        else:
            reward_type = "LIFE"
            current_user.lives = min(5, current_user.lives + 2)
            display = "+2 Cyber Hearts Recharged"
            val = 2

    elif box_type == "SILVER":
        if roll < 0.35:
            reward_type = "XP"
            val = random.choice([300, 400, 500])
            current_user.xp += val
            display = f"+{val} Cyber XP"
        elif roll < 0.65:
            reward_type = "COINS"
            val = random.choice([150, 200, 250])
            current_user.coins += val
            display = f"+{val} Cyber Coins"
        else:
            reward_type = "LIFE"
            current_user.lives = 5
            display = "FULL HEARTS REFILL (5/5)"
            val = 5

    else:  # CYBER_GOLD
        if roll < 0.30:
            reward_type = "XP"
            val = 1000
            current_user.xp += val
            display = "+1000 Massive XP Jackpot!"
        elif roll < 0.60:
            reward_type = "COINS"
            val = 500
            current_user.coins += val
            display = "+500 Cyber Coins Surge!"
        elif roll < 0.85:
            reward_type = "LIFE"
            current_user.lives = 5
            display = "MAX HEARTS REFILL (5/5)"
            val = 5
        else:
            reward_type = "TITLE"
            display = "Unlocked Title: 'Cyber Overlord'"
            val = "Cyber Overlord"

    box_record = MysteryBoxReward(
        user_id=current_user.id,
        box_type=box_type,
        reward_type=reward_type,
        reward_value=str(val)
    )
    db.add(box_record)
    await db.commit()

    return MysteryBoxOpenResponse(
        success=True,
        reward_type=reward_type,
        reward_value=str(val),
        reward_display=display,
        coins_left=current_user.coins
    )


@router.post("/streak/claim")
async def claim_daily_streak(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.streak += 1
    xp_bonus = 50 * min(current_user.streak, 7)
    coins_bonus = 20 * min(current_user.streak, 7)
    current_user.xp += xp_bonus
    current_user.coins += coins_bonus

    await db.commit()
    return {
        "success": True,
        "new_streak": current_user.streak,
        "xp_awarded": xp_bonus,
        "coins_awarded": coins_bonus,
        "message": f"{current_user.streak}-Day Streak Maintained!"
    }
