import io
import sys
from contextlib import redirect_stdout


def test_greet():
    from starter_code import greet
    f = io.StringIO()
    with redirect_stdout(f):
        greet()
    output = f.getvalue().strip()
    assert output == "Hello, World!", f"Expected 'Hello, World!', but got '{
        output}'"
