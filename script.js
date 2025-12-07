// --- ユーティリティ関数 ---

// 全角半角・カンマ対応の数値取得
const getVal = (id) => {
    // 全角数字を半角に変換し、カンマを削除
    const val = document.getElementById(id).value.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/,/g, '');
    return parseFloat(val) || 0;
};

// --- ⚙️ 計算のメイン関数 ---
// 変数名: 基礎HP(A), オーバーヒール(B), 魔道具1(C), 魔道具2(D), 魔力回路(E), その他(G)
function calculateHP(A, B, C, D, E, G) {
    // F/Aの割り算エラーを防ぐため、Aが0の場合は1として計算
    A = Math.max(A, 1); 
    
    const B_rate = B / 100;
    const C_rate = C / 100;
    const D_rate = D / 100;
    const G_rate = G / 100;

    // F (現在HP) の計算 (かけ算するたびに切り捨て)
    const term1 = Math.floor(A * (1 + B_rate)); 
    const term2 = Math.floor((Math.floor(A * (1 + C_rate)) - A) * (1 + B_rate)); 
    const term3 = Math.floor((Math.floor(A * (1 + D_rate)) - A) * (1 + B_rate)); 
    const term4 = Math.floor((Math.floor(A * (1 + G_rate)) - A) * (1 + B_rate)); 
    const term5 = Math.floor(E * B_rate);

    const F = term1 + term2 + term3 + term4 + term5;

    // HP割合 (F/A) - 比較に使用 (④ 再修正)
    const ratio = F / A;

    return { F, ratio, A };
}


// --- 📊 全キャラ計算と比較結果表示の関数 ---
function calculateAndCompare() {
    const totalChars = 5;
    const allResults = [];
    let validCharCount = 0;
    
    // ターゲットキャラIDと共通オーバーヒールを取得
    const targetId = parseInt(document.getElementById('target-char').value);
    const B_common = getVal('B_common');

    for (let i = 1; i <= totalChars; i++) {
        // Bは共通値を使用し、個別入力は無視する (ただし、猶予計算の際は個別のBを使う可能性があるため、入力値は取得しておく)
        const A = getVal(`A${i}`);
        const B_individual = getVal(`B${i}`);
        const C = getVal(`C${i}`);
        const D = getVal(`D${i}`);
        const E = getVal(`E${i}`);
        const G = getVal(`G${i}`);

        // 2箇所以上の入力があれば有効とみなす (Bは共通だが、カードの入力値としてカウント)
        const inputValues = [A, B_individual, C, D, E, G];
        const significantInputs = inputValues.filter(v => v > 0).length;
        
        if (significantInputs >= 2) {
            validCharCount++;
            
            // 計算実行 (Bは共通値を使用)
            const { F, ratio } = calculateHP(A, B_common, C, D, E, G);

            allResults.push({
                id: i,
                name: `キャラクター ${i}`,
                A: A,
                F: F,
                ratio: ratio,
                rawInputs: { A, B: B_common, C, D, E, G } // 猶予計算のために全入力を保存
            });
        }
    }

    if (validCharCount < 2) {
        document.getElementById('results-container').innerHTML = '<p class="gap-info">計算と比較を行うには、最低2体のキャラクターで2箇所以上のパラメーターを入力してください。</p>';
        return;
    }
    
    // ⑤ 順位付け (現在HP F、HP割合 F/A、ともに低い順)
    const hpRanked = [...allResults].sort((a, b) => a.F - b.F);
    const ratioRanked = [...allResults].sort((a, b) => a.ratio - b.ratio);

    let htmlContent = '';

    // ③ Fのランキング (低い順)
    htmlContent += '<h3>🏆 順位 (現在HP F のみ - 低い順)</h3>';
    htmlContent += generateRankTable(hpRanked, 'F');
    
    // ③ F/Aのランキング (低い順)
    htmlContent += '<h3>🏆 順位 (HP割合 F/A のみ - 低い順)</h3>';
    htmlContent += generateRankTable(ratioRanked, 'ratio');
    
    // 猶予の計算と表示
    htmlContent += generateAdjustmentProposal(ratioRanked, targetId, allResults, B_common);

    document.getElementById('results-container').innerHTML = htmlContent;
}

// 順位テーブルを生成するヘルパー関数 (⑥ランキング対象項目のみ)
function generateRankTable(data, sortKey) {
    let table = '<table><tr><th>順位</th><th>キャラ名</th>';
    
    if (sortKey === 'F') {
        table += '<th>現在HP (F)</th>';
    } else { // ratio
        table += '<th>HP割合 (F/A)</th>';
    }
    table += '</tr>';
    
    data.forEach((char, index) => {
        const rank = index + 1;
        // ① 割合計算は小数点以下10桁まで表示
        const displayValue = sortKey === 'F' ? char.F.toLocaleString() : char.ratio.toFixed(10); 
        
        // F/Aで1位（最下位）の行を強調
        const rankClass = sortKey === 'ratio' && rank === 1 ? 'rank-min' : '';

        table += `
            <tr class="${rankClass}">
                <td>${rank}</td>
                <td>${char.name}</td>
                <td>${displayValue}</td>
            </tr>
        `;
    });
    table += '</table>';
    return table;
}

// 猶予計算のロジック
function findAIncrease(initialA, targetRatio, B, C, D, E, G, maxA) {
    let minA = initialA;
    let maxLimit = maxA;
    let finalA = initialA;
    
    // 探索上限を超えるなら終了
    if (initialA >= maxLimit) return 0;

    // 100回試行して高精度な値を探す
    for (let i = 0; i < 100; i++) {
        const midA = (minA + maxLimit) / 2;
        if (midA > maxA) { // 常に制約上限を守る
             maxLimit = midA;
             continue;
        }

        const currentRatio = calculateHP(midA, B, C, D, E, G).ratio; 

        if (currentRatio < targetRatio) {
            minA = midA;
        } else {
            maxLimit = midA;
        }
        finalA = midA;
    }
    
    const A_increase = finalA - initialA;
    
    // 増加量が0または負なら、増加は不要/不可能
    if (A_increase <= 0.000001) return 0; 
    
    // 増加量が制約上限を超えている場合は、制約上限までとする
    if (finalA > maxA) return maxA - initialA;

    // 正の整数を提案するため、切り上げ
    return Math.ceil(A_increase); 
}

// 調整案の生成
function generateAdjustmentProposal(ratioRanked, targetId, allResults, B_common) {
    const target = allResults.find(c => c.id === targetId);
    if (!target) return '';

    const currentLowest = ratioRanked[0];
    let htmlContent = `<h3>🛠️ 調整案 (${target.name} を最下位にするために)</h3>`;
    
    // ターゲットがすでに最下位の場合
    if (currentLowest.id === target.id) {
        const secondLowest = ratioRanked[1];
        if (!secondLowest) return htmlContent + '<p class="gap-info">他の比較対象がいません。</p>';
        
        // ② 増加上限: 2位キャラの基礎HPまで (A_second - A_target)
        const maxAIncrease = Math.max(0, secondLowest.A - target.A);
        const targetRatio = secondLowest.ratio;
        const { B, C, D, E, G } = currentLowest.rawInputs;
        
        const requiredIncrease = findAIncrease(target.A, targetRatio, B, C, D, E, G, target.A + maxAIncrease);

        if (requiredIncrease > 0 && requiredIncrease <= maxAIncrease) {
            htmlContent += `<p class="gap-info">✅ ${target.name} は現在 **最も低いHP効率** です。</p>`;
            htmlContent += `<p>2位 (${secondLowest.name}, A=${secondLowest.A.toLocaleString()}) と同等のHP効率になるには、<br>
            現在の基礎HP (${currentLowest.A.toLocaleString()}) から **約 +${requiredIncrease.toLocaleString()}** の<br>
            **基礎HP (A)** を追加で確保する必要があります。
            </p>`;
        } else if (requiredIncrease === 0) {
            htmlContent += `<p class="gap-info">✅ ${target.name} はすでに2位 (${secondLowest.name}) と同等以上のHP効率です (差異: ${(secondLowest.ratio - target.ratio).toFixed(10)})。</p>`;
        } else {
            htmlContent += `<p class="gap-info">現在の ${target.name} の基礎HP (${target.A.toLocaleString()}) では、2位 (${secondLowest.name}, A=${secondLowest.A.toLocaleString()}) の基礎HPまで上げても、最下位を維持できません。</p>`;
        }
    
    // ターゲットが2位以降の場合
    } else {
        htmlContent += `<p>現在の最下位は ${currentLowest.name} (F/A: ${currentLowest.ratio.toFixed(10)}) です。</p>`;
        
        const nonTargets = allResults.filter(c => c.id !== target.id);
        let foundAdjustment = false;
        
        // --- 調整案 1: 基礎HPの上昇のみで解決できるか検証（優先） ---
        htmlContent += '<h4>1. 他のキャラの基礎HPを上げる調整案 (最優先)</h4>';
        
        nonTargets.forEach(otherChar => {
            const { B, C, D, E, G } = otherChar.rawInputs;
            const currentRatio = otherChar.ratio;
            const targetRatio = target.ratio - 0.0000000001; // ターゲットが最下位になるようにわずかに下げる
            
            // 増加上限: ターゲットキャラの基礎HPまで (A_target - A_other)
            const maxAIncrease = Math.max(0, target.A - otherChar.A);
            
            const requiredIncrease = findAIncrease(otherChar.A, targetRatio, B, C, D, E, G, otherChar.A + maxAIncrease);

            if (requiredIncrease > 0 && requiredIncrease <= maxAIncrease) {
                 htmlContent += `<p class="adjustment-success">🎉 成功案! ${otherChar.name} の **基礎HP (A)** を **約 +${requiredIncrease.toLocaleString()}** (上限A=${otherChar.A.toLocaleString() + maxAIncrease}) 増加させると、${target.name} が最下位になります。</p>`;
                 foundAdjustment = true;
            }
        });

        if (!foundAdjustment) {
            htmlContent += '<p class="adjustment-fail">基礎HPの上昇のみでは、ターゲットを最下位にすることはできませんでした。</p>';

            // --- 調整案 2: 魔道具を外す調整とHP上昇の組み合わせ（次点） ---
            htmlContent += '<h4>2. 他のキャラの魔道具を外す調整案</h4>';
            let foundMagicToolAdjustment = false;

            nonTargets.forEach(otherChar => {
                const { A, B, C, D, E, G } = otherChar.rawInputs;
                const maxAIncrease = Math.max(0, target.A - otherChar.A);
                const targetRatio = target.ratio - 0.0000000001;

                // Dを外す検証 (D > 0 の場合)
                if (D > 0) {
                    // Dを外した状態での基礎HP増加量を計算
                    const requiredIncrease = findAIncrease(A, targetRatio, B, C, 0, E, G, A + maxAIncrease);
                    if (requiredIncrease >= 0 && requiredIncrease <= maxAIncrease) {
                        const increaseText = requiredIncrease > 0 ? ` AND 基礎HPを **+${requiredIncrease.toLocaleString()}** 上げる` : '';
                        htmlContent += `<p class="adjustment-success">🎉 成功案! ${otherChar.name} の **魔道具Dを外す**${increaseText} と、${target.name} が最下位になります。</p>`;
                        foundMagicToolAdjustment = true;
                    }
                }

                // Cを外す検証 (C > 0 の場合)
                if (C > 0) {
                     const d_val = D > 0 ? D : 0; 
                     const requiredIncrease = findAIncrease(A, targetRatio, B, 0, d_val, E, G, A + maxAIncrease);
                     if (requiredIncrease >= 0 && requiredIncrease <= maxAIncrease) {
                         const increaseText = requiredIncrease > 0 ? ` AND 基礎HPを **+${requiredIncrease.toLocaleString()}** 上げる` : '';
                         htmlContent += `<p class="adjustment-success">🎉 成功案! ${otherChar.name} の **魔道具Cを外す**${increaseText} と、${target.name} が最下位になります。</p>`;
                         foundMagicToolAdjustment = true;
                     }
                }
            });

            if (!foundMagicToolAdjustment) {
                htmlContent += '<p class="adjustment-fail">魔道具を外す、または基礎HPを上げても、ターゲットを最下位にすることはできませんでした。</p>';
            }
        }
    }

    return htmlContent;
}


// ページ読み込み時に、5キャラ分の入力欄を自動生成
document.addEventListener('DOMContentLoaded', () => {
    const inputContainer = document.getElementById('character-inputs');
    
    // 入力フォームのラベルとデフォルト値
    const fields = [
        { id: 'A', label: '基礎HP (A)', value: '' },       // ⑥ 空欄
        { id: 'B', label: 'オーバーヒール (B) (%)', value: '20' }, // ⑥ 20 (個別入力は無視されるが、UIのため)
        { id: 'C', label: '魔道具1 (C) (%)', value: '5' },  // ⑥ 5
        { id: 'D', label: '魔道具2 (D) (%)', value: '5' },  // ⑥ 5
        { id: 'G', label: 'その他 (G) (%)', value: '0' },   // ⑥ 0
        { id: 'E', label: '魔力回路 (E)', value: '' },      // ⑥ 空欄
    ];
    
    // ① 入力フォームの表示順 (Bは共通入力を使用するため、個別入力欄は非表示にしても良いが、今回は表示順として定義)
    const displayOrder = ['A', 'C', 'D', 'G', 'B', 'E'];
    const orderedFields = displayOrder.map(id => fields.find(f => f.id === id));


    for (let i = 1; i <= 5; i++) {
        const charDiv = document.createElement('div');
        charDiv.className = 'character-card';
        
        let cardContent = `<h3>キャラクター ${i}</h3>`;
        
        orderedFields.forEach(field => {
            // Bは共通入力があるため、個別のBは非推奨だが、もし将来個別入力に戻す場合に備えて薄く表示
            const style = (field.id === 'B' || field.id === 'E' || field.id === 'A') ? 'font-style: italic; color: #777;' : ''; 
            
            cardContent += `
                <label style="${style}">${field.label}: 
                    <input type="text" id="${field.id}${i}" value="${field.value}" min="0">
                </label>
            `;
        });

        charDiv.innerHTML = cardContent;
        inputContainer.appendChild(charDiv);
    }
    
    // 初回ロード時に計算を実行
    calculateAndCompare();
});