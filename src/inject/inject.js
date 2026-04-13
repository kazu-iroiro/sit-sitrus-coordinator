(function() {
    console.log("SITRUS Coordinator: inject.js が 読み込まれました。");

    // 定員表示の状態をチェック
    const showTeiinColumnInitial = localStorage.getItem('showTeiinColumn') !== 'false';
    if (!showTeiinColumnInitial) {
        console.log("SITRUS Coordinator: 定員(残)表示は無効です。inject.jsの処理をスキップします。");
        return;
    }

    // --- 最終行が隠れるのを防ぐための微調整CSSを動的に追加 ---
    const style = document.createElement('style');
    style.textContent = `
        .ag-header-cell-label {
            white-space: nowrap !important;
        }
        /* 表の下部に少し余白を設ける */
        .ag-center-cols-viewport {
            padding-bottom: 15px !important;
        }
    `;
    document.head.appendChild(style);

    // 定員表示の状態管理（content.jsで更新される）
    let showTeiinColumn = showTeiinColumnInitial;
    let gridInstances = [];

    let checkCount = 0;
    const interval = setInterval(() => {
        if (window.agGrid && window.agGrid.createGrid) {
            clearInterval(interval);
            // ag-Gridのフック
            hookAgGrid();
            // localStorage監視開始
            setupStorageListener();
        }
        checkCount++;
        if (checkCount > 100) clearInterval(interval);
    }, 100);

    function setupStorageListener() {
        // window.postMessage でコンテンツスクリプトからの通知をリッスン
        window.addEventListener('message', (event) => {
            // 通知ソースは自分のウィンドウかつ、コンテンツスクリプトからの通知であることを確認
            if (event.source !== window || event.data.type !== 'SC_TEIIN_TOGGLE') {
                return;
            }
            
            const newValue = event.data.checked;
            if (newValue !== showTeiinColumn) {
                showTeiinColumn = newValue;
                // 全グリッドの列表示を更新
                if (gridInstances.length > 0) {
                    gridInstances.forEach(gridApi => {
                        gridApi.setColumnVisible('teiin_zansu_display', showTeiinColumn);
                    });
                    console.log("定員列の表示/非表示を切り替え:", showTeiinColumn);
                }
            }
        });
    }

    function hookAgGrid() {
        const originalCreateGrid = window.agGrid.createGrid;
        if (originalCreateGrid._isScHooked) return;

        function modifyColumnDefs(options) {
            if (!options || !options.columnDefs) return;

            function processCols(cols) {
                const origIndex = cols.findIndex(c => c.field === 'teiin');
                if (origIndex !== -1) {
                    cols.splice(origIndex, 1);
                }

                // 開講時期の列インデックスを探す
                const kaikoIndex = cols.findIndex(c => c.field === 'kaiko_jiki_name' || c.field === 'kaiko_jiki_name_eng');
                
                // 開講時期が見つかり、かつまだ追加されていなければ挿入
                if (kaikoIndex !== -1 && !cols.some(c => c.field === 'teiin_zansu_display')) {
                    const headerText = typeof window.JEMode === 'function' 
                        ? window.JEMode("定員(残)", "Cap(Rem)") 
                        : "定員(残)";
                    
                    const teiinCol = {
                        headerName: headerText,
                        field: "teiin_zansu_display",
                        width: 105,
                        minWidth: 90,
                        wrapHeaderText: false,
                        filter: 'agNumberColumnFilter',
                        valueGetter: function(params) {
                            return (params.data && params.data.teiin !== null) ? params.data.teiin : null;
                        },
                        cellRenderer: function(params) {
                            const container = document.createElement('span');
                            
                            if (!params.data || params.data.teiin == null) {
                                container.style.color = '#999';
                                container.textContent = '-';
                                return container;
                            }
                            
                            // teiin を数値に強制
                            const teiin = Number(params.data.teiin);
                            if (isNaN(teiin)) {
                                container.style.color = '#999';
                                container.textContent = '-';
                                return container;
                            }
                            
                            const teiinSpan = document.createElement('span');
                            teiinSpan.textContent = String(teiin);
                            container.appendChild(teiinSpan);
                            
                            // zansu を数値に強制
                            const zansu = Number(params.data.teiin_zansu);
                            
                            // 残数が有効な数値の場合のみ括弧を表示
                            if (!isNaN(zansu) && zansu != null) {
                                container.appendChild(document.createTextNode(' ('));
                                
                                const zansuSpan = document.createElement('span');
                                zansuSpan.style.color = '#000';
                                zansuSpan.style.fontWeight = 'bold';
                                zansuSpan.textContent = String(zansu);
                                container.appendChild(zansuSpan);
                                
                                container.appendChild(document.createTextNode(')'));
                            }
                            
                            return container;
                        }
                    };
                    
                    // 開講時期の直前に挿入
                    cols.splice(kaikoIndex, 0, teiinCol);
                }

                // グループ化されたカラム（children）があれば再帰的に探索
                cols.forEach(col => {
                    if (col.children && Array.isArray(col.children)) {
                        processCols(col.children);
                    }
                });
            }

            processCols(options.columnDefs);
        }

        // createGrid関数をオーバーライド
        function myCreateGrid(element, options) {
            modifyColumnDefs(options);
            const gridApi = originalCreateGrid.apply(this, arguments);
            
            gridInstances.push(gridApi);
            
            if (gridApi.addEventListener) {
                gridApi.addEventListener('gridReady', function() {
                    if (!showTeiinColumn) {
                        gridApi.setColumnVisible('teiin_zansu_display', false);
                    }
                });
            } else {
                setTimeout(() => {
                    if (!showTeiinColumn) {
                        gridApi.setColumnVisible('teiin_zansu_display', false);
                    }
                }, 100);
            }
            
            return gridApi;
        }
        
        myCreateGrid._isScHooked = true;

        try {
            window.agGrid.createGrid = myCreateGrid;
            if (window.agGrid.createGrid !== myCreateGrid) throw new Error("Frozen");
        } catch (e) {
            window.agGrid = new Proxy(window.agGrid, {
                get: function(target, prop, receiver) {
                    if (prop === 'createGrid') return myCreateGrid;
                    return Reflect.get(target, prop, receiver);
                }
            });
        }
    }
})();