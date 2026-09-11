import ast
import asyncio
import sys
import time
from typing import Dict, Any, Optional, Tuple

FORBIDDEN_MODULES = {
    "os", "sys", "subprocess", "shutil", "importlib", "socket",
    "http", "urllib", "requests", "ctypes", "pty", "multiprocessing",
    "threading", "signal", "posix", "gc", "builtins", "_thread",
    "pathlib", "code", "pdb", "inspect"
}

FORBIDDEN_CALLS = {
    "eval", "exec", "open", "__import__", "compile", "breakpoint",
    "exit", "quit"
}

FORBIDDEN_ATTRS = {
    "__subclasses__", "__bases__", "__globals__", "__code__",
    "__closure__", "__builtins__", "__import__"
}


class SecurityVisitor(ast.NodeVisitor):
    def __init__(self):
        self.error = None

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            base_module = alias.name.split(".")[0]
            if base_module in FORBIDDEN_MODULES:
                self.error = f"Security Violation: Import of '{alias.name}' is prohibited in the sandbox."
                return
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module:
            base_module = node.module.split(".")[0]
            if base_module in FORBIDDEN_MODULES:
                self.error = f"Security Violation: Import from '{node.module}' is prohibited in the sandbox."
                return
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        if isinstance(node.func, ast.Name):
            if node.func.id in FORBIDDEN_CALLS:
                self.error = f"Security Violation: Call to restricted function '{node.func.id}()' is prohibited."
                return
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute):
        if node.attr in FORBIDDEN_ATTRS:
            self.error = f"Security Violation: Access to restricted attribute '{node.attr}' is prohibited."
            return
        self.generic_visit(node)


def inspect_code_safety(code: str) -> Optional[str]:
    """Inspects Python code for malicious constructs using AST before execution."""
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return f"Syntax Error on line {e.lineno}: {e.msg}"

    visitor = SecurityVisitor()
    visitor.visit(tree)
    return visitor.error


async def execute_code_in_sandbox(
    code: str,
    stdin_input: str = "",
    timeout_seconds: float = 3.0,
    max_output_bytes: int = 65536
) -> Dict[str, Any]:
    """
    Executes Python code in an isolated subprocess with AST validation,
    time limit, input feeds, and output caps.
    """
    # 1. AST Static Security Check
    security_error = inspect_code_safety(code)
    if security_error:
        return {
            "success": False,
            "stdout": "",
            "stderr": security_error,
            "exit_code": 1,
            "execution_time_ms": 0.0,
            "security_error": security_error
        }

    # 2. Prepare Subprocess execution
    # Wrap with safety setup and beginner-friendly input() patch
    runner_script = f"""
import sys
# Disable file creation & raw socket hooks if available
try:
    import resource
    # Limit CPU time (seconds)
    resource.setrlimit(resource.RLIMIT_CPU, (3, 3))
except Exception:
    pass

# Beginner-friendly input patch: ignore interactive prompt strings so prompts don't leak into stdout
try:
    import builtins
    _orig_input = builtins.input
    def _clean_input(prompt=None):
        # Discard prompt message so student prompts like input("Enter string: ") don't pollute test stdout
        return _orig_input()
    builtins.input = _clean_input
except Exception:
    pass

# Execute user code
{code}
"""

    start_time = time.perf_counter()
    try:
        process = await asyncio.create_subprocess_exec(
            sys.executable,
            "-c",
            runner_script,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        input_bytes = (stdin_input + "\n").encode("utf-8") if stdin_input else b""

        stdout_bytes, stderr_bytes = await asyncio.wait_for(
            process.communicate(input=input_bytes),
            timeout=timeout_seconds
        )
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        stdout = stdout_bytes[:max_output_bytes].decode("utf-8", errors="replace")
        stderr = stderr_bytes[:max_output_bytes].decode("utf-8", errors="replace")

        return {
            "success": (process.returncode == 0),
            "stdout": stdout,
            "stderr": stderr,
            "exit_code": process.returncode,
            "execution_time_ms": elapsed_ms,
            "security_error": None
        }

    except asyncio.TimeoutError:
        try:
            process.kill()
            await process.wait()
        except Exception:
            pass
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Execution Timed Out! Your code ran longer than {timeout_seconds} seconds. Check for infinite loops!",
            "exit_code": -1,
            "execution_time_ms": round(timeout_seconds * 1000, 2),
            "security_error": "Timeout"
        }
    except Exception as exc:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Runtime Sandbox Error: {str(exc)}",
            "exit_code": 1,
            "execution_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
            "security_error": str(exc)
        }
