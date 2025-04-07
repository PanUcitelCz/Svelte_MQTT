<script lang="ts">
  import mqtt from 'mqtt';

  let topic = $state('svelte/test');
  let messageToSend = $state('');
  let messages = $state<string[]>([]);
  let latestMessage = $state('');
  let error = $state('');
  let client: mqtt.MqttClient | null = null;

  $effect(() => {
    if (!topic) return;

    // Vyčisti staré spojení a data
    messages = [];
    latestMessage = '';
    error = '';
    if (client?.connected) {
      client.unsubscribe(topic);
      client.end(true);
    }

    // Načti MQTT přístup z backendu
    (async () => {
      try {
        const res = await fetch('/API/mqtt/config', {
          method: 'POST'
        });

        const cfg = await res.json();

        if (!res.ok) {
          error = cfg.error || 'Nepodařilo se získat MQTT přihlašovací údaje';
          return;
        }

        client = mqtt.connect(cfg.url, {
          username: cfg.username,
          password: cfg.password
        });

        client.on('connect', () => {
          client?.subscribe(topic);
        });

        client.on('message', (_, payload) => {
          const msg = payload.toString();
          messages.push(msg);
          latestMessage = msg;
        });

        client.on('error', (err) => {
          console.error('MQTT chyba:', err);
          error = 'MQTT připojení selhalo';
        });
      } catch (err) {
        error = 'Chyba při navazování spojení';
        console.error(err);
      }
    })();

    return () => {
      client?.end(true);
    };
  });

  function sendMessage() {
    if (client?.connected && messageToSend.trim()) {
      client.publish(topic, messageToSend);
      messageToSend = '';
    }
  }
</script>

<h2>MQTT klient (živý přenos)</h2>

<div class="form">
  <input bind:value={topic} placeholder="Zadej topic" />
  <div class="row">
    <input bind:value={messageToSend} placeholder="Zpráva" />
    <button onclick={sendMessage}>Odeslat</button>
  </div>
</div>

{#if error}
  <p class="error">{error}</p>
{/if}

{#if latestMessage}
  <div class="latest">
    <h3>Poslední zpráva:</h3>
    <p>{latestMessage}</p>
  </div>
{/if}

{#if messages.length}
  <div class="history">
    <h4>Historie:</h4>
    <ul>
      {#each messages as msg}
        <li>{msg}</li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 1em;
    max-width: 500px;
  }

  .row {
    display: flex;
    gap: 0.5em;
  }

  input {
    padding: 0.5em;
    border: 1px solid #ccc;
    border-radius: 6px;
    flex: 1;
  }

  button {
    padding: 0.5em 1em;
    background-color: #3182ce;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  button:hover {
    background-color: #2563eb;
  }

  .error {
    color: red;
    margin-top: 1em;
  }

  .latest {
    margin-top: 2em;
    padding: 1em;
    background-color: #eef6ff;
    border: 1px solid #90cdf4;
    border-radius: 6px;
  }

  .history {
    margin-top: 1.5em;
  }

  .history ul {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 250px;
    overflow-y: auto;
    border: 1px solid #ccc;
    padding: 1em;
    border-radius: 6px;
    background-color: #f9f9f9;
  }

  .history li {
    margin-bottom: 0.5em;
    padding-bottom: 0.5em;
    border-bottom: 1px dashed #ccc;
  }
</style>
