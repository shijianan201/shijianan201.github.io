---
layout: page
title: "Data Deletion Request"
description: "Instructions on how to request the deletion of your OmniHub account and associated data."
---

# OmniHub Data Deletion Request

At OmniHub, we value your privacy and provide a straightforward way for you to request the deletion of your account and any associated data stored on our systems (specifically Firebase Authentication data).

### Interactive Deletion Request Form

Fill out the details below to generate a pre-formatted email to our support team.

<div class="well" style="background-color: #f9f9f9; border-radius: 8px; padding: 25px;">
  <form id="deletionForm">
    <div class="form-group">
      <label for="uid">User ID or Registered Email *</label>
      <input type="text" class="form-control" id="uid" placeholder="e.g., user@example.com or FB-12345" required>
      <span class="help-block" style="font-size: 0.85em;">Found in App Settings > Profile.</span>
    </div>
    <div class="form-group">
      <label for="deviceId">Device ID (Optional)</label>
      <input type="text" class="form-control" id="deviceId" placeholder="Your device identifier">
    </div>
    <div class="form-group">
      <label for="reason">Reason for Deletion</label>
      <textarea class="form-control" id="reason" rows="3" placeholder="Why would you like to delete your data? (Help us improve)"></textarea>
    </div>
    <div class="checkbox">
      <label>
        <input type="checkbox" id="confirm" required> I understand that this action is permanent and cannot be undone.
      </label>
    </div>
    <button type="button" class="btn btn-danger btn-lg" onclick="generateEmail('en')">
      <i class="fa fa-envelope"></i> Send Deletion Request
    </button>
  </form>
</div>

<hr>

# OmniHub 数据删除请求 (简体中文)

在 OmniHub，我们非常重视您的隐私。如果您希望删除您的账户及存储在我们系统中的相关数据（主要为 Firebase 登录数据），请按照以下说明操作。

### 互动式申请表单

填写以下信息以自动生成发送给技术支持团队的邮件。

<div class="well" style="background-color: #f9f9f9; border-radius: 8px; padding: 25px;">
  <form id="deletionFormZh">
    <div class="form-group">
      <label for="uidZh">注册邮箱或用户 ID *</label>
      <input type="text" class="form-control" id="uidZh" placeholder="例如：user@example.com 或 FB-12345" required>
      <span class="help-block" style="font-size: 0.85em;">可在应用“设置 > 个人资料”中查看。</span>
    </div>
    <div class="form-group">
      <label for="deviceIdZh">设备 ID (选填)</label>
      <input type="text" class="form-control" id="deviceIdZh" placeholder="您的设备识别码">
    </div>
    <div class="form-group">
      <label for="reasonZh">删除原因</label>
      <textarea class="form-control" id="reasonZh" rows="3" placeholder="您为什么要删除数据？（帮助我们改进应用）"></textarea>
    </div>
    <div class="checkbox">
      <label>
        <input type="checkbox" id="confirmZh" required> 我已知晓此操作不可逆，账户一旦删除将无法恢复。
      </label>
    </div>
    <button type="button" class="btn btn-danger btn-lg" onclick="generateEmail('zh')">
      <i class="fa fa-envelope"></i> 发送删除申请邮件
    </button>
  </form>
</div>

<script>
function generateEmail(lang) {
  var uid, deviceId, reason, confirm, subject, body;
  
  if (lang === 'zh') {
    uid = document.getElementById('uidZh').value;
    deviceId = document.getElementById('deviceIdZh').value;
    reason = document.getElementById('reasonZh').value;
    confirm = document.getElementById('confirmZh').checked;
    
    if (!uid) { alert('请填写注册邮箱或用户 ID'); return; }
    if (!confirm) { alert('请确认您已知晓此操作不可逆'); return; }
    
    subject = "APP-Omnihub: Data Deletion Request";
    body = "申请删除 OmniHub 登录账户及相关数据。\n\n" +
           "用户 ID / 邮箱: " + uid + "\n" +
           "设备 ID: " + (deviceId || "未提供") + "\n" +
           "删除原因: " + (reason || "未提供") + "\n\n" +
           "确认事项: [X] 我已知晓此操作不可逆，账户一旦删除将无法恢复。";
  } else {
    uid = document.getElementById('uid').value;
    deviceId = document.getElementById('deviceId').value;
    reason = document.getElementById('reason').value;
    confirm = document.getElementById('confirm').checked;
    
    if (!uid) { alert('Please enter your User ID or Email'); return; }
    if (!confirm) { alert('Please confirm the permanent nature of this action'); return; }
    
    subject = "APP-Omnihub: Data Deletion Request";
    body = "Please delete my OmniHub account data.\n\n" +
           "User ID / Email: " + uid + "\n" +
           "Device ID: " + (deviceId || "Not provided") + "\n" +
           "Reason: " + (reason || "Not provided") + "\n\n" +
           "Confirmation: [X] I understand that this action is permanent and cannot be undone.";
  }
  
  var mailtoUrl = "mailto:xiaojiangagaga@gmail.com" +
                  "?subject=" + encodeURIComponent(subject) +
                  "&body=" + encodeURIComponent(body);
  
  window.location.href = mailtoUrl;
}
</script>

<hr>

### What Data Will Be Deleted? / 将删除哪些数据？

Upon processing your request, we will permanently remove:
*   Your Firebase Authentication profile (Email, UID, Provider Info).
*   Any cloud-synced preferences or metadata linked to your account.
*   **Note:** Locally stored data (like your encrypted Password Book) must be deleted by uninstalling the app from your device.

处理您的请求后，我们将永久删除：
*   您的 Firebase 身份验证配置文件（邮箱、UID、登录平台信息）。
*   任何与您的账户关联的云端同步偏好设置或元数据。
*   **注意:** 本地存储的数据（如加密的密码本）需要您通过卸载应用来手动清除。
