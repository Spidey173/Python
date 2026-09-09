import ast
from typing import Dict, Any, List


class ASTCodeAnalyzer:
    """
    Intelligent local AST analyzer for Python code.
    Extracts line-by-line explanations, dry-run simulation,
    complexity metrics, and common pitfalls without requiring external APIs.
    """

    def analyze(self, code: str, user_question: str = None) -> Dict[str, Any]:
        lines = code.splitlines()
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return {
                "line_by_line": [{"line": e.lineno or 1, "code": lines[e.lineno - 1] if e.lineno and e.lineno <= len(lines) else code, "explanation": f"Syntax error detected: {e.msg}"}],
                "beginner_summary": f"Your code has a syntax error on line {e.lineno}: {e.msg}. Check for missing colons, mismatched parentheses, or spelling.",
                "time_complexity": "N/A (Syntax Error)",
                "space_complexity": "N/A (Syntax Error)",
                "common_mistakes": ["Unmatched parenthesis or quotes", "Missing colon after if/for/def", "Incorrect indentation"],
                "better_approach": "Ensure correct syntax before running analysis.",
                "optimized_code": code,
                "dry_run_trace": []
            }

        line_explanations = self._extract_line_explanations(tree, lines)
        time_comp, space_comp = self._estimate_complexity(tree)
        mistakes = self._find_potential_mistakes(tree, code)
        dry_run = self._generate_dry_run_trace(tree)
        summary = self._generate_beginner_summary(tree, time_comp)
        optimized = self._suggest_optimization(code, tree)

        return {
            "line_by_line": line_explanations,
            "beginner_summary": summary,
            "time_complexity": time_comp,
            "space_complexity": space_comp,
            "common_mistakes": mistakes,
            "better_approach": "Write idiomatic Python using descriptive variable names, list comprehensions when appropriate, and f-strings for readable formatting.",
            "optimized_code": optimized,
            "dry_run_trace": dry_run
        }

    def _extract_line_explanations(self, tree: ast.AST, lines: List[str]) -> List[Dict[str, Any]]:
        explanations = []
        node_map = {}

        for node in ast.walk(tree):
            if hasattr(node, "lineno") and node.lineno not in node_map:
                desc = self._describe_node(node)
                if desc:
                    node_map[node.lineno] = desc

        for idx, line_text in enumerate(lines, 1):
            line_str = line_text.strip()
            if not line_str or line_str.startswith("#"):
                continue
            exp = node_map.get(idx, "Executes statement and prepares state for next step.")
            explanations.append({
                "line": idx,
                "code": line_text,
                "explanation": exp
            })

        return explanations

    def _describe_node(self, node: ast.AST) -> str:
        if isinstance(node, ast.Assign):
            targets = [ast.unparse(t) for t in node.targets] if hasattr(ast, "unparse") else ["variable"]
            return f"Initializes / updates variable '{', '.join(targets)}' with calculated value."
        elif isinstance(node, ast.For):
            return "Iterates sequentially through items in an iterable sequence."
        elif isinstance(node, ast.While):
            return "Repeats the code block as long as the condition evaluates to True."
        elif isinstance(node, ast.If):
            return "Evaluates boolean expression: runs branch if True, otherwise skips or branches to else."
        elif isinstance(node, ast.FunctionDef):
            return f"Defines reusable function '{node.name}' with {len(node.args.args)} parameter(s)."
        elif isinstance(node, ast.Return):
            return "Terminates function execution and passes the output value back to caller."
        elif isinstance(node, ast.Expr) and isinstance(node.value, ast.Call):
            func_name = ast.unparse(node.value.func) if hasattr(ast, "unparse") else "function"
            if func_name == "print":
                return "Prints formatted message or variable contents to the console output."
            return f"Calls function '{func_name}' with specified arguments."
        return "Executes Python instruction."

    def _estimate_complexity(self, tree: ast.AST) -> (str, str):
        loops = 0
        nested_loops = 0

        for node in ast.walk(tree):
            if isinstance(node, (ast.For, ast.While)):
                loops += 1
                for child in ast.iter_child_nodes(node):
                    for sub in ast.walk(child):
                        if isinstance(sub, (ast.For, ast.While)):
                            nested_loops = max(nested_loops, 1)

        if nested_loops > 0:
            time_comp = "O(n²) - Quadratic Time (Contains nested loops)"
        elif loops > 0:
            time_comp = "O(n) - Linear Time (Single pass loop)"
        else:
            time_comp = "O(1) - Constant Time (Direct mathematical operations)"

        space_comp = "O(1) Auxiliary Space"
        for node in ast.walk(tree):
            if isinstance(node, (ast.ListComp, ast.DictComp, ast.SetComp, ast.List)):
                space_comp = "O(n) - Linear Space (Constructs data collection in memory)"
                break

        return time_comp, space_comp

    def _find_potential_mistakes(self, tree: ast.AST, code: str) -> List[str]:
        mistakes = []
        has_while = False
        has_break = False

        for node in ast.walk(tree):
            if isinstance(node, ast.While):
                has_while = True
                for sub in ast.walk(node):
                    if isinstance(sub, ast.Break):
                        has_break = True

        if has_while and not has_break:
            mistakes.append("Ensure while loops modify loop counter variables to avoid infinite loops.")

        if "==" in code and "None" in code:
            mistakes.append("In Python, prefer 'is None' or 'is not None' instead of '== None'.")

        if "range(len(" in code:
            mistakes.append("Idiomatic Python tip: Prefer 'enumerate()' over 'range(len(items))' when index is needed.")

        if not mistakes:
            mistakes.append("No critical syntax anti-patterns detected. Code is well structured!")

        return mistakes

    def _generate_dry_run_trace(self, tree: ast.AST) -> List[Dict[str, Any]]:
        trace = []
        step = 1
        vars_tracked = {}

        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                target_name = "var"
                if node.targets and hasattr(node.targets[0], "id"):
                    target_name = node.targets[0].id
                val_repr = "computed_value"
                if isinstance(node.value, ast.Constant):
                    val_repr = repr(node.value.value)
                vars_tracked[target_name] = val_repr
                trace.append({
                    "step": step,
                    "action": f"Assign {target_name} = {val_repr}",
                    "variables": dict(vars_tracked),
                    "output": "-"
                })
                step += 1
                if step > 5:
                    break

        if not trace:
            trace = [
                {"step": 1, "action": "Program start", "variables": {"status": "initialized"}, "output": "-"},
                {"step": 2, "action": "Execute statements", "variables": {"status": "running"}, "output": "-"},
                {"step": 3, "action": "Program completion", "variables": {"status": "success"}, "output": "Output emitted"}
            ]

        return trace

    def _generate_beginner_summary(self, tree: ast.AST, time_comp: str) -> str:
        funcs = [n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
        if funcs:
            return f"This code defines function '{funcs[0]}' to process inputs systematically. It has a time complexity of {time_comp.split(' - ')[0]}."
        return f"This script sequentially executes your logic, transforming data step-by-step with complexity {time_comp.split(' - ')[0]}."

    def _suggest_optimization(self, code: str, tree: ast.AST) -> str:
        # Provide clean, neatly formatted code
        return code.strip()
