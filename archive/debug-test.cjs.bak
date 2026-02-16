const { generatePythonCode } = require('./client/src/lib/bot-generator');

const botData = {
  nodes: [
    {
      id: 'help',
      type: 'command',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'Справка',
        command: '/help'
      }
    }
  ],
  edges: []
};

try {
  const code = generatePythonCode(botData, 'TestBot');
  console.log('Contains handle_command_: ', code.includes('async def handle_command_'));
  console.log('Contains user_id = message.from_user.id: ', code.includes('user_id = message.from_user.id'));
  console.log('Code length: ', code.length);
} catch (error) {
  console.error('Error:', error.message);
}