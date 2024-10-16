
const fs = require('fs').promises;
const path = require('path');

const assignmentsPath = path.join(__dirname, '..', 'assignments');

async function startAssignment(container, assignmentId) {
    const assignmentPath = path.join(assignmentsPath, assignmentId);

    // Read description
    const description = await fs.readFile(path.join(assignmentPath, 'description.md'), 'utf8');

    // Copy starter code to container
    const starterCode = await fs.readFile(path.join(assignmentPath, 'starter_code.py'), 'utf8');
    await container.exec({
        Cmd: ['bash', '-c', `echo '${starterCode}' > /app/assignment.py`],
    });

    return { description, starterCode };
}

async function submitAssignment(container, assignmentId) {
    const testCommand = `cd /app && python -m pytest /assignments/${assignmentId}/test_${assignmentId}.py`;

    return new Promise((resolve, reject) => {
        container.exec({
            Cmd: ['bash', '-c', testCommand],
            AttachStdout: true,
            AttachStderr: true,
        }, (err, exec) => {
            if (err) reject(err);
            exec.start((err, stream) => {
                if (err) reject(err);
                let output = '';
                stream.on('data', (chunk) => {
                    output += chunk.toString();
                });
                stream.on('end', () => {
                    const passed = !output.includes('FAILED');
                    resolve({ passed, output });
                });
            });
        });
    });
}

module.exports = { startAssignment, submitAssignment };