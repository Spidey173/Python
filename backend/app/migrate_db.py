import asyncio
from sqlalchemy import text
from app.database import engine


async def migrate():
    async with engine.begin() as conn:
        print("Migrating database to clean architecture (removing gamification tables & columns)...")
        # Drop gamification tables
        await conn.execute(text("DROP TABLE IF EXISTS mystery_box_rewards CASCADE;"))
        await conn.execute(text("DROP TABLE IF EXISTS user_achievements CASCADE;"))
        await conn.execute(text("DROP TABLE IF EXISTS achievements CASCADE;"))

        # Drop columns from users
        for col in ["xp", "coins", "level", "lives", "last_life_refill"]:
            try:
                await conn.execute(text(f"ALTER TABLE users DROP COLUMN IF EXISTS {col} CASCADE;"))
                print(f"Dropped users.{col}")
            except Exception as e:
                print(f"Note on users.{col}: {e}")

        # Drop columns from challenges
        for col in ["xp_reward", "coin_reward", "is_boss", "boss_name", "boss_hp"]:
            try:
                await conn.execute(text(f"ALTER TABLE challenges DROP COLUMN IF EXISTS {col} CASCADE;"))
                print(f"Dropped challenges.{col}")
            except Exception as e:
                print(f"Note on challenges.{col}: {e}")

        # Drop columns from user_progress
        try:
            await conn.execute(text("ALTER TABLE user_progress DROP COLUMN IF EXISTS stars CASCADE;"))
            print("Dropped user_progress.stars")
        except Exception as e:
            print(f"Note on user_progress.stars: {e}")

        print("Migration completed successfully!")


if __name__ == "__main__":
    asyncio.run(migrate())
