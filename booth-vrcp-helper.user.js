// ==UserScript==
// @name         VRCPirate for booth.pm
// @namespace    Violentmonkey Scripts
// @match        https://booth.pm/*/items/*
// @updateURL    https://github.com/VRCPirate/Userscripts/raw/refs/heads/main/booth-vrcp-helper.user.js
// @grant        GM_xmlhttpRequest
// @connect      api-v3.vrcpirate.com
// @version      1.3.0
// @author       doclan
// @description  在 Booth 商品页面显示 VRCPirate 跳转链接
// ==/UserScript==

(() => {
  'use strict';

  const itemId = window.location.pathname.match(/^\/[^/]+\/items\/(\d+)(?:\/|$)/)?.[1];
  if (!itemId) return;

  const variations = document.querySelector('#variations');
  if (!variations?.parentElement) return;

  const box = document.createElement('div');
  box.className = 'vrcp-booth-helper';
  box.style.margin = '1em 0';

  const message = document.createElement('p');
  message.textContent = '[VRCPirate] 正在搜索…';
  box.append(message);
  variations.parentElement.before(box);

  GM_xmlhttpRequest({
    method: 'GET',
    url: `https://api-v3.vrcpirate.com/assets?page=1&search=${encodeURIComponent(itemId)}`,
    timeout: 15000,

    onload: (response) => {
      if (response.status < 200 || response.status >= 300) {
        message.textContent = `[VRCPirate] 搜索失败（HTTP ${response.status}）。`;
        return;
      }

      try {
        const result = JSON.parse(response.responseText);
        const asset = Array.isArray(result?.data) ? result.data[0] : null;
        const assetId = asset?.id;

        if (
          !result?.meta ||
          result.meta.totalItems < 1 ||
          (typeof assetId !== 'string' && typeof assetId !== 'number')
        ) {
          message.textContent = '[VRCPirate] 没有找到匹配的资源。';
          return;
        }

        const link = document.createElement('a');
        link.href = `https://vrcpirate.com/iviewer/${encodeURIComponent(String(assetId))}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = '点击这里跳转免费';

        message.replaceChildren(document.createTextNode('[🟢] '), link);
      } catch (error) {
        console.error('[VRCPirate] API 响应解析失败：', error);
        message.textContent = '[VRCPirate] 无法读取搜索结果。';
      }
    },

    onerror: () => {
      message.textContent = '[VRCPirate] 搜索时发生网络错误。';
    },

    ontimeout: () => {
      message.textContent = '[VRCPirate] 搜索超时。';
    },
  });

  console.log('[VRCPirate] UserScript 已加载，商品 ID：', itemId);
})();
