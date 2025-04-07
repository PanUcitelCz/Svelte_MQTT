import { json } from '@sveltejs/kit';
import { env } from '$env/static/private';

export async function POST() {
  return json({
    url: "wss://393e161e237141a591b2fcd99713b7f3.s1.eu.hivemq.cloud:8884/mqtt",
    username: "hivemq.webclient.1744038564293",
    password: "A74axH5f&QP<q@>Y3bsB"
  });
}
