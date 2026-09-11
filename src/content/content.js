/**
 * SITRUS Coordinator - Content Script
 */

class SitrusCoordinator {
    constructor() {
        this.init();
    }

    init() {
        console.log('SITRUS Coordinator: 起動しました。');

        this.enhanceNavbarBrand();

        // 現在のページを判定して処理を分岐
        if (document.getElementById('loginButton')) {
            console.log('ログイン画面のUX改善');
            this.applyUiImprovements();
            this.bindEvents();
        } else {
            console.log('ダッシュボード画面の機能を拡張します。');
            this.initDashboard();
        }
    }

    /* =========================================================
       ag-Gridのフックと定員列の追加処理
       ========================================================= */
    injectPageScript() {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('src/inject/inject.js');

        script.onload = function () {
            console.log("SITRUS Coordinator: inject.js の読み込みに成功しました！");
            this.remove();
        };

        (document.head || document.documentElement).appendChild(script);
    }

    /* =========================================================
       ナビゲーションバーのブランドテキスト改善
       ========================================================= */
    enhanceNavbarBrand() {
        const brandHome = document.getElementById('brandHome');

        if (brandHome && !brandHome.classList.contains('sitrus-enhanced')) {
            // サブタイトルを作成
            const subtitle = document.createElement('span');
            subtitle.className = 'navbar-brand-subtitle';
            subtitle.textContent = 'with SITRUS Coordinator';

            // 挿入
            brandHome.appendChild(subtitle);
            brandHome.classList.add('sitrus-enhanced');
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
        // 旧バージョンの説明文が存在する場合のみ非表示にする
        const loginMsgEl = document.getElementById('login_msg');
        if (loginMsgEl) {
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
        versionText.textContent = 'SITRUS Coordinator - v1.1.0';
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
       ダッシュボード用の処理
       ========================================================= */
    initDashboard() {
        // ag-Gridをフック
        this.injectPageScript();

        // DOM構築完了後に定員チェックボックスを追加
        setTimeout(() => {
            this.addTeiinCheckbox();
        }, 500);
    }

    /* =========================================================
       定員表示チェックボックスの追加
       ========================================================= */
    addTeiinCheckbox() {
        // 既に存在する場合はスキップ
        if (document.getElementById('sc_teiin_wrapper')) return;

        const showTeiinColumn = localStorage.getItem('showTeiinColumn') === 'true';

        // チェックボックスのラッパー要素を作成
        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.id = 'sc_teiin_wrapper';
        checkboxWrapper.className = 'ml-2 my-1 d-flex align-items-center';
        checkboxWrapper.innerHTML = `
            <label style="margin: 0; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 0.85rem; color: var(--fg-muted, #666); font-weight: 600; transition: color 0.2s;">
                <input type="checkbox" id="teiin_display" ${showTeiinColumn ? 'checked' : ''} style="margin: 0; cursor: pointer; width: 14px; height: 14px;">
                定員(残)を表示
            </label>
        `;

        // 挿入場所の検索
        const themeWrap = document.getElementById('topbarThemeWrap');

        if (themeWrap && themeWrap.parentElement) {
            themeWrap.parentElement.insertBefore(checkboxWrapper, themeWrap);
        } else {
            // 見つからない場合
            const navbarCollapse = document.querySelector('.navbar-collapse .ml-auto');
            if (navbarCollapse) {
                navbarCollapse.appendChild(checkboxWrapper);
            }
        }

        // イベントリスナーの登録
        const checkbox = document.getElementById('teiin_display');
        if (checkbox) {
            checkbox.addEventListener('change', function () {
                localStorage.setItem('showTeiinColumn', this.checked);
                // inject.jsに通知
                window.postMessage({
                    type: 'SC_TEIIN_TOGGLE',
                    checked: this.checked
                }, '*');
                console.log("SITRUS Coordinator: 定員列の表示切り替え:", this.checked);
                location.reload();
            });
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