#!/bin/bash
# Initialize all Kafka topics for CareNest platform
set -e

TOPICS=(
  "alert.triggered"
  "notification.requests"
  "notification.send"
  "notification.sent"
  "notification.failed"
  "order.created"
  "order.paid"
  "order.refunded"
  "order.ready_to_ship"
  "order.shipped"
  "order.delivered"
  "inventory.reserved"
  "inventory.released"
  "iot.device.registered"
  "iot.heartbeat.received"
  "iot.location.received"
  "iot.vitals.received"
  "iot.sos.received"
  "iot.fall.received"
  "subscription.created"
  "subscription.renewed"
  "subscription.cancelled"
  "subscription.expired"
  "activation.code.created"
  "device.activation.requested"
  "device.activated"
  "shipment.created"
  "shipment.status_changed"
  "shipment.failed"
  "imei.allocated"
)

for topic in "${TOPICS[@]}"; do
  /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --if-not-exists --topic "$topic" --partitions 1 --replication-factor 1
done

echo "All CareNest Kafka topics initialized successfully!"
