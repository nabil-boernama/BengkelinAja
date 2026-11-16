"use client";

import { useEffect, useRef } from "react";
import { API_BASE_URL, getToken } from "@/lib/apiClient";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

let pusherClient;

async function getPusherClient() {
  if (!pusherClient) {
    const { default: Pusher } = await import("pusher-js");
    pusherClient = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      channelAuthorization: {
        customHandler: async (params, callback) => {
          try {
            const token = getToken();
            if (!token) throw new Error("Sesi login tidak ditemukan.");

            const response = await fetch(`${API_BASE_URL}/realtime/auth`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                socket_id: params.socketId,
                channel_name: params.channelName,
              }),
            });
            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.message || "Gagal mengautentikasi channel realtime.");
            }
            callback(null, result);
          } catch (error) {
            callback(error, null);
          }
        },
      },
    });
  }

  return pusherClient;
}

export default function useRealtimeOrders(onChange, { enabled = true } = {}) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!enabled || !PUSHER_KEY || !PUSHER_CLUSTER) return undefined;

    let active = true;
    let client;
    let channel;
    const handleChange = () => onChangeRef.current?.();

    getPusherClient()
      .then((instance) => {
        if (!active) return;
        client = instance;
        channel = client.subscribe("private-orders");
        channel.bind("order.changed", handleChange);
      })
      .catch((error) => {
        console.error("Gagal memulai pembaruan order realtime:", error);
      });

    return () => {
      active = false;
      if (channel) {
        channel.unbind("order.changed", handleChange);
        client.unsubscribe("private-orders");
      }
    };
  }, [enabled]);
}
