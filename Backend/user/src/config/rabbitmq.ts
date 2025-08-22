import ampq from 'amqplib';

let channel: ampq.Channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await ampq.connect({
            protocol: 'amqp',
            hostname: process.env.RABBITMQ_HOST || 'localhost',
            port: parseInt(process.env.RABBITMQ_PORT!) || 5672,
            username: process.env.RABBITMQ_USER || 'guest',
            password: process.env.RABBITMQ_PASS || 'guest',
        });
        channel = await connection.createChannel();
        
        console.log('✅ Connected to RabbitMQ');
    } catch (error) {
        console.error('❌ Error connecting to RabbitMQ:', error);
    }
};

export const publishToQueue = async (queue: string, message: any) => {
  try {
    if (!channel) {
      throw new Error("⚠️ Channel is not initialized");
    }

    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true, // ensures message survives broker restarts
    });

    console.log(`✅ Message sent to ${queue}:`, message);
  } catch (error) {
    console.error(`❌ Error sending message to ${queue}:`, error);
  }
};
