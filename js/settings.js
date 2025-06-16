// 設定ページのロジック

document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('gemini-api-key');
    const userNameInput = document.getElementById('user-name');
    const settingsForm = document.getElementById('settings-form');
    const clearHistoryBtn = document.getElementById('clear-history');
    const messageDiv = document.getElementById('settings-message');

    // 保存済み設定の読み込み
    const savedApiKey = localStorage.getItem('geminiApiKey') || '';
    const savedUserName = localStorage.getItem('userName') || '';
    apiKeyInput.value = savedApiKey;
    userNameInput.value = savedUserName;

    // 設定保存
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        localStorage.setItem('geminiApiKey', apiKeyInput.value);
        localStorage.setItem('userName', userNameInput.value);
        showMessage('設定を保存しました。', false);
    });

    // 履歴一括消去
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('本当に履歴をすべて消去しますか？')) {
            localStorage.removeItem('history');
            showMessage('履歴を消去しました。', false);
        }
    });

    function showMessage(msg, isError) {
        messageDiv.textContent = msg;
        messageDiv.className = isError ? 'error' : 'success';
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = '';
        }, 2000);
    }
});
