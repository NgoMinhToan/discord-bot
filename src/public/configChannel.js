export function renderConfig(channel, ws, channels) {
  const configDiv = document.getElementById('configChannel');
  configDiv.innerHTML = '';

  // Nếu channel không hợp lệ thì return
  if (!channel || !channel.id || !channel.name) {
    configDiv.innerHTML = '<div style="color:#ffd27f;">Không tìm thấy cấu hình kênh!</div>';
    return;
  }

  // Card container
  const card = document.createElement('div');
  card.style = `
    background: #23272e;
    border-radius: 10px;
    box-shadow: 0 2px 12px #0005;
    padding: 1.2rem 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    color: #d2ffd2;
    max-width: 480px;
  `;

  // Title
  const title = document.createElement('div');
  title.textContent = `Cài đặt cho kênh: ${channel.name}`;
  title.style = "font-weight:bold;font-size:1.15rem;margin-bottom:1rem;color:#7fff7f;letter-spacing:1px;";
  card.appendChild(title);

  // --- Reply group ---
  const replyGroup = document.createElement('div');
  replyGroup.style = "margin-bottom:1.2rem;display:flex;align-items:center;gap:0.7rem;";

  const replyLabel = document.createElement('label');
  replyLabel.style = "font-size:1rem;display:flex;align-items:center;gap:0.4rem;cursor:pointer;";
  const replyCheckbox = document.createElement('input');
  replyCheckbox.type = 'checkbox';
  replyCheckbox.checked = !!channel.reply;
  replyCheckbox.style = "accent-color:#7fff7f;width:18px;height:18px;";
  replyLabel.appendChild(replyCheckbox);
  replyLabel.appendChild(document.createTextNode('Tự động reply lại tin nhắn'));

  replyGroup.appendChild(replyLabel);
  card.appendChild(replyGroup);

  // --- Handle message server group ---
  const handleGroup = document.createElement('div');
  handleGroup.style = "margin-bottom:1.2rem;display:flex;align-items:center;gap:0.7rem;";

  const handleLabel = document.createElement('label');
  handleLabel.style = "font-size:1rem;display:flex;align-items:center;gap:0.4rem;cursor:pointer;";
  const handleCheckbox = document.createElement('input');
  handleCheckbox.type = 'checkbox';
  handleCheckbox.checked = !!channel.handleMessage;
  handleCheckbox.style = "accent-color:#ffd27f;width:18px;height:18px;";
  handleLabel.appendChild(handleCheckbox);
  handleLabel.appendChild(document.createTextNode('Xử lý qua webhook ngoài (server trung gian)'));

  handleGroup.appendChild(handleLabel);
  card.appendChild(handleGroup);

  // --- Webhook config group ---
  const webhookGroup = document.createElement('div');
  webhookGroup.style = "margin-bottom:0.7rem;display:flex;flex-direction:column;gap:0.5rem;";

  let webhookInput, callbackField, submitBtn;

  function renderWebhookFields() {
    webhookGroup.innerHTML = '';
    if (handleCheckbox.checked) {
      // Webhook URL input
      const webhookLabel = document.createElement('label');
      webhookLabel.textContent = 'Webhook URL nhận tin nhắn:';
      webhookLabel.style = "font-size:0.97rem;color:#ffd27f;margin-bottom:0.2rem;";
      webhookInput = document.createElement('input');
      webhookInput.type = 'text';
      webhookInput.placeholder = 'https://your-webhook-server/receive';
      webhookInput.value = channel.webhookUrl || '';
      webhookInput.style = `
        width:100%;padding:0.45rem 0.7rem;
        border-radius:6px;border:1px solid #2e3a2e;
        background:#181c20;color:#d2ffd2;font-size:1rem;
      `;

      // Callback URL (readonly)
      const callbackLabel = document.createElement('label');
      callbackLabel.textContent = 'Đường dẫn callback để webhook gửi kết quả về:';
      callbackLabel.style = "font-size:0.97rem;color:#ffd27f;margin-top:0.5rem;";
      callbackField = document.createElement('input');
      callbackField.type = 'text';
      callbackField.readOnly = true;
      callbackField.value = `${window.location.origin}/webhook-callback/${channel.id}/<msgId>`;
      callbackField.style = `
        width:100%;padding:0.45rem 0.7rem;
        border-radius:6px;border:1px solid #2e3a2e;
        background:#23272e;color:#7fff7f;font-size:1rem;
        margin-bottom:0.2rem;
      `;

      // Copy button
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.textContent = 'Copy callback URL';
      copyBtn.style = "margin-left:0.5rem;padding:0.3rem 0.8rem;font-size:0.95rem;border-radius:5px;border:none;background:#7fff7f;color:#23272e;cursor:pointer;";
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(callbackField.value);
        copyBtn.textContent = 'Đã copy!';
        setTimeout(() => copyBtn.textContent = 'Copy callback URL', 1200);
      };

      // Submit button
      submitBtn = document.createElement('button');
      submitBtn.textContent = 'Lưu cấu hình webhook';
      submitBtn.type = 'button';
      submitBtn.style = "margin-top:0.6rem;padding:0.45rem 1.2rem;font-size:1rem;border-radius:6px;border:none;background:#ffd27f;color:#23272e;cursor:pointer;font-weight:bold;";
      submitBtn.onclick = () => {
        ws.send(JSON.stringify({
          type: 'set_channel_config',
          channelId: channel.id,
          config: {
            reply: replyCheckbox.checked,
            handleMessage: handleCheckbox.checked,
            webhookUrl: webhookInput.value
          }
        }));
      };

      webhookGroup.appendChild(webhookLabel);
      webhookGroup.appendChild(webhookInput);
      webhookGroup.appendChild(callbackLabel);
      webhookGroup.appendChild(callbackField);
      webhookGroup.appendChild(copyBtn);
      webhookGroup.appendChild(submitBtn);
    }
  }

  // Sự kiện thay đổi
  replyCheckbox.onchange = () => {
    ws.send(JSON.stringify({
      type: 'set_channel_config',
      channelId: channel.id,
      config: { reply: replyCheckbox.checked }
    }));
    // Không tự render lại, chờ server gửi về channel_config mới
  };

  handleCheckbox.onchange = () => {
    ws.send(JSON.stringify({
      type: 'set_channel_config',
      channelId: channel.id,
      config: { handleMessage: handleCheckbox.checked }
    }));
    // Không tự render lại, chờ server gửi về channel_config mới
  };

  renderWebhookFields();

  card.appendChild(webhookGroup);
  configDiv.appendChild(card);
}