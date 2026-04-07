/**
 * SITRUS Coordinator - Content Script
 */

class SitrusCoordinator {
    constructor() {
        this.init();
    }

    init() {
        console.log('SITRUS Coordinator: 起動しました。');

        // sitrus.cssの読み込みをブロック
        this.blockSitrusCss();

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
       sitrus.cssのフィルタリング適用処理
       ========================================================= */
    async filterAndApplySitrusCss(href) {
        try {
            const response = await fetch(href);
            if (!response.ok) {
                console.warn(`SITRUS Coordinator: CSSの取得に失敗しました。 status=${response.status} href=${href}`);
                return;
            }
            let cssText = await response.text();

            // 削除する既知のセレクタ
            const knownSelectors = [
                '.sidebar-sticky',
                '._navbar_fixed_top_slide',
                '._navbar_fixed_top_slide1',
                '._navbar_fixed_top_slide2',
                '.nav-tabs',
                '.tab-pane',
                '.tab-content',
                '.jumbotron',
                '.msg_box_YesNo',
                '.msg_box_overlay',
                '.jik_kakunin_header',
                '.modal-body1',
                '.jik_kakunin_body'
            ];

            knownSelectors.forEach(selector => {
                const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`${escapedSelector}\\s*{[^{}]*}`, 'gi');
                cssText = cssText.replace(regex, '');
            });

            if (cssText.trim().length > 0) {
                // 既存要素を取得、なければ新規作成
                let styleTag = document.getElementById('sitrus-filtered-style');
                if (!styleTag) {
                    styleTag = document.createElement('style');
                    styleTag.id = 'sitrus-filtered-style';
                    document.head.appendChild(styleTag);
                }
                styleTag.textContent = cssText;
                console.log('SITRUS Coordinator: 未知のスタイルを適用しました。');
            }
        } catch (error) {
            console.error('SITRUS Coordinator: CSSの取得または処理に失敗しました。', error);
        }
    }

    blockSitrusCss() {
        const processedUrls = new Set();
        let observer = null;

        const handleLink = (node) => {
            if (node.nodeType === 1 && node.tagName === 'LINK' && node.href && node.href.includes('sitrus.css')) {
                const url = node.href;
                if (!processedUrls.has(url)) {
                    processedUrls.add(url);
                    console.log('SITRUS Coordinator: sitrus.cssを検出し、フィルタリングを開始します。:', url);

                    // フィルタリング処理
                    this.filterAndApplySitrusCss(url);
                }
                // オリジナルのlinkタグは削除
                node.remove();
            }
        };

        // 既存のリンクを処理
        document.querySelectorAll('link[href*="sitrus.css"]').forEach(handleLink);

        // 新規追加されるリンクを監視
        observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.tagName === 'LINK') {
                        handleLink(node);
                    }
                }
            }
        });

        // head のみ監視、オプションを最小化
        observer.observe(document.head, {
            childList: true
        });

        // 20秒経ったらdisconnect
        setTimeout(() => {
            observer?.disconnect();
            console.log('SITRUS Coordinator: blockSitrusCss の監視を終了しました。');
        }, 20000);
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
        this.reconstructTimetableLayout();

        this.setupJumbotronObserver();
    }

    /**
     * jumbotron 監視用 MutationObserver をセットアップ
     */
    setupJumbotronObserver() {
        const mainContainer = document.querySelector('[class^="_navbar_fixed_top_slide"]')?.querySelector('.container');
        const targetElement = mainContainer || document.body;

        let observer = null;
        let hasProcessed = false;

        // 初期状態で存在する .jumbotron を処理
        this.hideEmptyJumbotrons();

        observer = new MutationObserver(() => {
            if (!hasProcessed) {
                this.hideEmptyJumbotrons();
                hasProcessed = true;
                observer.disconnect();
                console.log('SITRUS Coordinator: jumbotron の処理が完了したため MutationObserver を停止しました。');
            }
        });

        observer.observe(targetElement, { childList: true, subtree: true });

        // ページ離脱時にdisconnect()
        window.addEventListener('beforeunload', () => {
            if (observer) {
                observer.disconnect();
            }
        }, { once: true });
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

    hideEmptyJumbotrons() {
        const jumbotrons = document.querySelectorAll('.jumbotron');
        jumbotrons.forEach(jumbo => {
            const textContent = jumbo.textContent.trim();
            const hasMedia = jumbo.querySelector('img, video, iframe, canvas, svg');

            const container = jumbo.closest('.container');
            const toggleBtn = container ? container.querySelector('.sc-toggle-info-btn') : null;

            // jumbotron内が空か確認
            if (textContent.length === 0 && !hasMedia) {
                jumbo.classList.add('sc-jumbotron-empty');
                jumbo.style.display = 'none';
                if (toggleBtn) {
                    toggleBtn.style.display = 'none';
                }
                console.log('SITRUS Coordinator: 空のJumbotronを検出したため非表示にしました。');
            } else {
                jumbo.classList.remove('sc-jumbotron-empty');
                jumbo.style.display = '';
                if (toggleBtn) {
                    toggleBtn.style.display = '';
                }
            }
        });
    }

    /* =========================================================
       時間割画面のUI再構築
       ========================================================= */
    reconstructTimetableLayout() {
        const slideWrapper = document.querySelector('[class^="_navbar_fixed_top_slide"]');
        const mainContainer = slideWrapper?.querySelector('.container');
        if (!mainContainer || !slideWrapper) return;


        const h3 = mainContainer.querySelector('h3');
        if (!h3) return;

        const titleText = h3.textContent;

        // ページに応じたクラスを body に付与する
        if (titleText.includes('時間割一覧')) {
            document.body.classList.add('page-timetable');
            console.log('SITRUS Coordinator: 時間割一覧ページを検出しました。');
        } else if (titleText.includes('現在までに履修している科目')) {
            document.body.classList.add('page-history');
            console.log('SITRUS Coordinator: 履修履歴ページを検出しました。');
        }

        // --- 新しいヘッダー枠の作成 ---
        const headerDiv = document.createElement('div');
        headerDiv.className = 'sc-main-header';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'sc-header-title';
        titleDiv.appendChild(h3);
        headerDiv.appendChild(titleDiv);

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'sc-header-controls';

        // --- タブボタン(自所属/全学)の移動 ---
        const jisyozokuBtn = document.getElementById('jisyozoku');
        const zengakuBtn = document.getElementById('zengaku');

        if (jisyozokuBtn && zengakuBtn) {
            const btnOldWrapper = jisyozokuBtn.closest('a#hicyusen_kikan3');

            const btnGroup = document.createElement('div');
            btnGroup.className = 'sc-btn-group';

            jisyozokuBtn.classList.add('sc-tab-btn');
            zengakuBtn.classList.add('sc-tab-btn');

            btnGroup.appendChild(jisyozokuBtn);
            btnGroup.appendChild(zengakuBtn);
            controlsDiv.appendChild(btnGroup);

            if (btnOldWrapper) {
                btnOldWrapper.style.display = 'none';
            }
        }

        // --- 説明文の開閉 ---
        const jumbotron = mainContainer.querySelector('.jumbotron');
        if (jumbotron) {
            if (!controlsDiv.querySelector('.sc-toggle-info-btn')) {
                const toggleInfoBtn = document.createElement('button');
                toggleInfoBtn.className = 'sc-toggle-info-btn';
                toggleInfoBtn.innerHTML = '✕ 閉じる';

                let isInfoOpen = true;
                toggleInfoBtn.addEventListener('click', () => {
                    isInfoOpen = !isInfoOpen;

                    jumbotron.classList.toggle('sc-jumbotron-hidden', !isInfoOpen);

                    // ボタンのテキストを切り替え
                    toggleInfoBtn.innerHTML = isInfoOpen ? '✕ 閉じる' : 'ℹ 説明を表示';
                });
                controlsDiv.appendChild(toggleInfoBtn);
            }
        }

        headerDiv.appendChild(controlsDiv);


        // 時間割ページのみ表の位置がおかしいため修正
        if (h3.textContent.includes('時間割一覧')) {
            // ページ内にある表をすべて探す
            const grids = document.querySelectorAll('#itiran_list, #r_list, #ji_list');
            grids.forEach(grid => {
                // 表が既に mainContainer の中にある場合は何もしない
                if (mainContainer.contains(grid)) return;

                // 表を囲んでいるレイアウト用の枠(.form-row)ごと、.containerの最後に移動させる
                const wrapper = grid.closest('.form-row') || grid.parentElement;
                if (wrapper) {
                    mainContainer.appendChild(wrapper);
                    console.log('SITRUS Coordinator: 迷子になっていた表を .container 内に救出しました。');
                }
            });

            const uselessLinks = document.querySelectorAll('a[id^="hicyusen_"], a[id^="cyu_"]');
            uselessLinks.forEach(link => {
                if (!link.querySelector('#itiran_list, #r_list, #ji_list, .sc-main-header, .jumbotron')) {
                    link.style.display = 'none';
                }
            });
        }
        mainContainer.prepend(headerDiv);
    }
}

window.addEventListener('load', () => {
    new SitrusCoordinator();
});