import { Kafka } from "kafkajs";
import config from "config";

async function main() {
    const brokers = config.get<string[]>("kafka.broker");

    const kafka = new Kafka({
        clientId: "catalog-service-consumer",
        brokers,
    });

    const consumer = kafka.consumer({ groupId: "catalog-service-debug-group" });

    await consumer.connect();
    await consumer.subscribe({ topic: "product", fromBeginning: true });

    console.log("[consumer] Subscribed to topic 'product'. Waiting for messages...\n");

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const value = message.value ? message.value.toString() : null;
            console.log("--- Kafka message ---");
            console.log("topic     :", topic);
            console.log("partition :", partition);
            console.log("offset    :", message.offset);
            console.log("value     :", value);
            console.log();
        },
    });
}

main().catch((err) => {
    console.error("[consumer] Error:", err);
    process.exit(1);
});
