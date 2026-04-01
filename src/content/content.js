/**
 * SITRUS Coordinator - Content Script
 */

class SitrusCoordinator {
    constructor() {
        this.init();
    }

    init() {
        console.log('SITRUS Coordinator: 起動しました。');

        // ナビゲーションバーのブランドテキスト修正
        this.enhanceNavbarBrand();

        // 現在のページを判定して処理を分岐
        if (document.getElementById('loginButton')) {
            console.log('ログイン画面のUIを改善します。');
            this.applyUiImprovements();
            this.bindEvents();
        } else if (document.querySelector('.sidebar-sticky')) {
            console.log('ダッシュボード画面のUIを改善します。');
            this.initDashboard();
        }
    }

    /* =========================================================
       ナビゲーションバーのブランドテキスト改善
       ========================================================= */
    enhanceNavbarBrand() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        // SITRUSシステムのテキストノードを検索
        let targetNode = null;
        for (let node of navbar.childNodes) {
            if (node.nodeType === 3 && node.textContent.includes('SITRUSシステム')) {
                targetNode = node;
                break;
            }
        }

        if (targetNode && !navbar.classList.contains('sitrus-enhanced')) {
            // ブランドコンテナを作成
            const brandContainer = document.createElement('span');
            brandContainer.className = 'navbar-brand-container';

            // メインテキストを作成
            const mainText = document.createElement('span');
            mainText.className = 'navbar-brand-main';
            mainText.textContent = 'SITRUSシステム';

            // サブタイトルを作成
            const subtitle = document.createElement('span');
            subtitle.className = 'navbar-brand-subtitle';
            subtitle.textContent = 'with SITRUS Coordinator';

            brandContainer.appendChild(mainText);
            brandContainer.appendChild(subtitle);

            // 元のテキストノードを置き換え
            targetNode.parentNode.replaceChild(brandContainer, targetNode);
            navbar.classList.add('sitrus-enhanced');
        }
    }

    /* =========================================================
       ログイン画面用の処理
       ========================================================= */
    applyUiImprovements() {
        document.body.classList.add('sitrus-coordinator-active');
        this.hideOriginalElementsSafely();
        this.injectNewUIElements();
    }

    hideOriginalElementsSafely() {
        // システム名の完全一致確認
        const systemNameEl = document.getElementById('system_name');
        if (systemNameEl && this.checkExactTextMatch(systemNameEl, 'SITRUSシステム')) {
            systemNameEl.style.display = 'none';
        }

        // 説明文の完全一致確認
        const loginMsgEl = document.getElementById('login_msg');
        const expectedMsg = '※学生の場合は「入力なし」で認証開始してください。教職員の場合は「参照する学生のユーザ名」を入力してください。';
        if (loginMsgEl && this.checkExactTextMatch(loginMsgEl, expectedMsg)) {
            loginMsgEl.style.display = 'none';
        }
    }

    injectNewUIElements() {
        // --- ロゴ ---
        const logoContainer = document.createElement('div');
        logoContainer.id = 'sc-logo-container';
        document.body.appendChild(logoContainer);

        // --- バージョン表記 ---
        const versionText = document.createElement('div');
        versionText.id = 'sc-version-text';
        versionText.textContent = 'SITRUS Coordinator - v1.0.0';
        document.body.appendChild(versionText);

        // --- 教職員向けトグルボタンとフォームの再配置 ---
        const loginBox = document.querySelector('.login-box');
        const loginButton = document.getElementById('loginButton');
        const formGroup = document.querySelector('.form-group');

        if (loginBox && loginButton && formGroup) {
            const toggleWrapper = document.createElement('div');
            toggleWrapper.id = 'sc-toggle-wrapper';

            const toggleText = document.createElement('span');
            toggleText.id = 'sc-faculty-toggle';
            toggleText.innerHTML = '<span class="sc-toggle-arrow">&gt;</span> 学籍番号の入力（教職員向け）';

            toggleWrapper.appendChild(toggleText);
            toggleWrapper.appendChild(formGroup);

            // ログインボタンの後に挿入
            loginButton.parentNode.insertBefore(toggleWrapper, loginButton.nextSibling);

            // 初期状態は非表示
            formGroup.classList.add('sc-form-hidden');
        }
    }

    bindEvents() {
        const toggleButton = document.getElementById('sc-faculty-toggle');
        const formGroup = document.querySelector('.form-group');

        if (toggleButton && formGroup) {
            toggleButton.addEventListener('click', () => {
                formGroup.classList.toggle('sc-form-hidden');
                toggleButton.classList.toggle('is-open');
            });
        }
    }

    /* =========================================================
       ダッシュボード（サイドバー）用の処理
       ========================================================= */
    initDashboard() {
        document.body.classList.add('sitrus-coordinator-dashboard');
        this.hideLoadingScreen();
    }

    /* =========================================================
       ローディング画面の制御
       ========================================================= */
    hideLoadingScreen() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /* =========================================================
       ユーティリティ
       ========================================================= */
    /**
     * 要素のテキストが期待する文字列と一致するか判定
     * @param {HTMLElement} element 
     * @param {string} expectedText 
     * @returns {boolean}
     */
    checkExactTextMatch(element, expectedText) {
        const normalize = (str) => str.replace(/\s+/g, '').trim();
        return normalize(element.textContent) === normalize(expectedText);
    }
}

window.addEventListener('load', () => {
    new SitrusCoordinator();
});