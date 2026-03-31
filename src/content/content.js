/**
 * SITRUS Coordinator - Content Script
 */

class SitrusCoordinator {
    constructor() {
        this.init();
    }

    init() {
        console.log('SITRUS Coordinator: 起動しました。');

        // ナビゲーションバーのブランドテキスト修正（全ページ共通）
        this.enhanceNavbarBrand();

        // 現在のページを判定して処理を分岐（既存の処理はそのまま維持）
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

        // navbarの直下で「SITRUSシステム」というテキストノードを探す
        let targetNode = null;
        for (let node of navbar.childNodes) {
            if (node.nodeType === 3 && node.textContent.includes('SITRUSシステム')) {
                targetNode = node;
                break;
            }
        }

        if (targetNode && !navbar.classList.contains('sitrus-enhanced')) {
            // スパンコンテナを作成
            const brandContainer = document.createElement('span');
            brandContainer.className = 'navbar-brand-container';

            // 「SITRUSシステム」テキストのスパンを作成
            const mainText = document.createElement('span');
            mainText.className = 'navbar-brand-main';
            mainText.textContent = 'SITRUSシステム';

            // 「with SITRUS Coordinator」のスパンを作成
            const subtitle = document.createElement('span');
            subtitle.className = 'navbar-brand-subtitle';
            subtitle.textContent = 'with SITRUS Coordinator';

            // コンテナに追加
            brandContainer.appendChild(mainText);
            brandContainer.appendChild(subtitle);

            // 元のテキストノードを置き換える
            targetNode.parentNode.replaceChild(brandContainer, targetNode);
            navbar.classList.add('sitrus-enhanced');
        }
    }

    /* =========================================================
       ログイン画面用の処理（変更なし）
       ========================================================= */
    applyUiImprovements() {
        // 1. 全体的なレイアウトのためのラッパークラスを付与
        document.body.classList.add('sitrus-coordinator-active');

        // 2. 元の不要な要素を安全に非表示にする（完全一致のみ）
        this.hideOriginalElementsSafely();

        // 3. 新しいUI要素（ロゴ、バージョン表記、教職員向けトグル）の追加
        this.injectNewUIElements();

        // // 4. 既存のフォームグループ（学番入力）を初期状態では非表示にするためのクラスを付与
        // const formGroup = document.querySelector('.form-group');
        // if (formGroup) {
        //     formGroup.classList.add('hidden-form');
        // }
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
        // --- ロゴ (SVG等の配置用コンテナ) ---
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

            // ★修正: フォームを toggleWrapper の「中」に入れる（絶対配置の基準にするため）
            toggleWrapper.appendChild(formGroup);

            // ログインボタンの「下」に挿入
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
                // フォームの表示/非表示クラスを切り替え（フェード＆スライド）
                formGroup.classList.toggle('sc-form-hidden');
                // トグルボタン自体の状態クラスを切り替え（矢印の回転用）
                toggleButton.classList.toggle('is-open');
            });
        }
    }

    /* =========================================================
       ダッシュボード（サイドバー）用の処理（追加）
       ========================================================= */
    initDashboard() {
        // ダッシュボード用のクラスを付与し、CSSでスタイルを適用できるようにする
        document.body.classList.add('sitrus-coordinator-dashboard');
        
        // ローディング画面を非表示にする
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
       ユーティリティ（変更なし）
       ========================================================= */
    /**
     * 要素のテキストが期待する文字列と完全に一致するか（空白等の揺れを吸収して）判定する
     * @param {HTMLElement} element 
     * @param {string} expectedText 
     * @returns {boolean}
     */
    checkExactTextMatch(element, expectedText) {
        // 改行や余分な空白を削除して比較
        const normalize = (str) => str.replace(/\s+/g, '').trim();
        return normalize(element.textContent) === normalize(expectedText);
    }
}

window.addEventListener('load', () => {
    new SitrusCoordinator();
});