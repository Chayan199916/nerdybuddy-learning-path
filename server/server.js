const WebSocket = require('ws');
const Docker = require('dockerode');
const { startAssignment, submitAssignment } = require('./assignmentManager');

const wss = new WebSocket.Server({ port: 3000 });
const docker = new Docker();

wss.on('connection', function connection(ws) {
    let container;
    let currentAssignment;

    ws.on('message', async function incoming(message) {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'init':
                container = await docker.createContainer({
                    Image: 'drone-3d-website_python-lab',
                    Cmd: ['/bin/bash'],
                    Tty: true,
                    OpenStdin: true,
                    HostConfig: {
                        Binds: [`${process.cwd()}/assignments:/assignments:ro`]
                    }
                });
                await container.start();
                ws.send(JSON.stringify({ type: 'init', containerId: container.id }));
                break;

            case 'command':
                if (container) {
                    const exec = await container.exec({
                        Cmd: ['bash', '-c', data.command],
                        AttachStdout: true,
                        AttachStderr: true,
                    });
                    const stream = await exec.start();
                    stream.on('data', (chunk) => {
                        ws.send(JSON.stringify({ type: 'output', content: chunk.toString() }));
                    });
                }
                break;

            case 'startAssignment':
                if (container) {
                    currentAssignment = data.assignmentId;
                    const result = await startAssignment(container, data.assignmentId);
                    ws.send(JSON.stringify({ type: 'assignmentStarted', ...result }));
                }
                break;

            case 'submitAssignment':
                if (container && currentAssignment) {
                    const result = await submitAssignment(container, currentAssignment);
                    ws.send(JSON.stringify({ type: 'assignmentResult', ...result }));
                }
                break;

            case 'close':
                if (container) {
                    await container.stop();
                    await container.remove();
                }
                break;
        }
    });

    ws.on('close', async function () {
        if (container) {
            await container.stop();
            await container.remove();
        }
    });
});