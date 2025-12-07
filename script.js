// --- ⚙️ 計算のメイン関数 ---
function calculateHP(A, B, C, D, E, G) {
    A = Math.max(A, 1); 
    
    const B_rate = B / 100;
    const C_rate = C / 100;
    const D_rate = D / 100;
    const G_rate = G / 100;

    // F (現在HP) の計算
    const term1 = Math.floor(A * (1 + B_rate)); 
    const term2 = Math.floor((Math.floor(A * (1 + C_rate)) - A) * (1 + B_rate)); 
    const term3 = Math.floor((Math.floor(A * (1 + D_rate)) - A) * (1 + B_rate)); 
    const term4 = Math.floor((Math.floor(A * (1 + G_rate)) - A) * (1 + B_rate)); 
    const term5 = Math.floor(E * B_rate);

    const F = term1 + term2 + term3 + term4 + term5;

    // ④ 新しい分母の計算: A + ⌊A×C%⌋ + ⌊A×D%⌋
    const new_denom = A + Math.floor(A * C_rate) + Math.floor(A * D_rate);
    
    // HP割合 (F/分母) - 比較に使用
    const ratio = F / new_denom;

    return { F, ratio, denom: new_denom };
}

// --- 📊 全キャラ計算と比較結果表示の関数 ---
function calculateAndCompare() {
    const totalChars = 5;
    const allResults = [];
    let validCharCount = 0;
    
    // ターゲットキャラIDを取得
    const targetId = parseInt(document.getElementById('target-char').value);

    for (let i = 1; i <= totalChars; i++) {
        // 全角半角対応のため、一度文字列として取得し、半角数字に変換してから数値化
        const getVal = (id) => {
            const val = document.getElementById(id).value.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/,/g, '');
            return parseFloat(val) || 0;
        };
        
        const A = getVal(`A${i}`);
        const B = getVal(`B${i}`);
        const C = getVal(`C${i}`);
        const D = getVal(`D${i}`);
        const E = getVal(`E${i}`);
        const G = getVal(`G${i}`);

        // 2箇所以上の入力があれば有効とみなす
        const inputValues = [A, B, C, D, E, G];
        const significantInputs = inputValues.filter(v => v > 0).length;
        
        if (significantInputs >= 2) {
            validCharCount++;
            
            const { F, ratio, denom } = calculateHP(A, B, C, D, E, G);

            allResults.push({
                id: i,
                name: `キャラクター ${i}`,
                A: A,
                F: F,
                ratio: ratio,
                denom: denom,
                rawInputs: { A, B, C, D, E, G }
            });
        }
    }

    if (validCharCount < 2) {
        document.getElementById('results-container').innerHTML = '<p class="gap-info">計算と比較を行うには、最低2体のキャラクターで2箇所以上のパラメーターを入力してください。</p>';
        return;
    }
    
    // ⑤ 順位付け (現在HP F、HP割合 F/分母、ともに低い順)
    const hpRanked = [...allResults].sort((a, b) => a.F - b.F);
    const ratioRanked = [...allResults].sort((a, b) => a.ratio - b.ratio);

    let htmlContent = '';

    // ③ Fのランキング (低い順)
    htmlContent += '<h3>🏆 順位 (現在HP F のみ - 低い順)</h3>';
    htmlContent += generateRankTable(hpRanked, 'F');
    
    // ③ F/分母のランキング (低い順)
    htmlContent += '<h3>🏆 順位 (HP割合 F/分母 のみ - 低い順)</h3>';
    htmlContent += generateRankTable(ratioRanked, 'ratio');
    
    // ⑦ 調整案の計算と表示
    htmlContent += generateAdjustmentProposal(ratioRanked, targetId, allResults);

    document.getElementById('results-container').innerHTML = htmlContent;
}

// 順位テーブルを生成するヘルパー関数 (⑥ランキング対象項目のみ)
function generateRankTable(data, sortKey) {
    let table = '<table><tr><th>順位</th><th>キャラ名</th>';
    
    if (sortKey === 'F') {
        table += '<th>現在HP (F)</th>';
    } else { // ratio
        table += '<th>HP割合 (F/分母)</th>';
    }
    table += '</tr>';
    
    data.forEach((char, index) => {
        const rank = index + 1;
        const displayValue = sortKey === 'F' ? char.F.toLocaleString() : char.ratio.toFixed(4);
        
        // F/分母で1位（最下位）の行を強調
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

// ⑦ 調整案の生成
function generateAdjustmentProposal(ratioRanked, targetId, allResults) {
    const target = allResults.find(c => c.id === targetId);
    if (!target) return '';

    const currentLowest = ratioRanked[0];
    let htmlContent = `<h3>🛠️ 調整案 (${target.name} を最下位にするために)</h3>`;

    // ターゲットがすでに最下位の場合 (⑦-⑴)
    if (currentLowest.id === target.id) {
        const secondLowest = ratioRanked[1];
        if (!secondLowest) {
            return htmlContent + '<p class="gap-info">他の比較対象がいません。</p>';
        }
        
        // 猶予計算 (2位に追いつくための基礎HP追加量)
        const targetRatio = secondLowest.ratio;
        const { B, C, D, E, G } = currentLowest.rawInputs;
        
        // Aをどれだけ増やせば目標比率に到達するかを探索
        let minA = currentLowest.A;
        let maxA = 1000000;
        let finalA = currentLowest.A;
        
        for (let i = 0; i < 100; i++) {
            const midA = (minA + maxA) / 2;
            const currentRatio = calculateHP(midA, B, C, D, E, G).ratio; 
            if (currentRatio < targetRatio) {
                minA = midA;
            } else {
                maxA = midA;
            }
            finalA = midA;
        }

        const A_increase = finalA - currentLowest.A;
        const displayAIncrease = Math.ceil(A_increase);

        htmlContent += `
            <p class="gap-info">✅ ${target.name} は現在 **最も低いHP効率** です。</p>
            <p>2位 (${secondLowest.name}) と同等のHP効率になるには、<br>
            現在の基礎HP (${currentLowest.A.toLocaleString()}) から **約 +${displayAIncrease.toLocaleString()}** の<br>
            **基礎HP (A)** を追加で確保する必要があります。
            </p>
        `;
    
    // ターゲットが2位以降の場合 (⑦-⑵)
    } else {
        htmlContent += `<p>現在の最下位は ${currentLowest.name} (F/分母: ${currentLowest.ratio.toFixed(4)}) です。</p>`;
        
        // --- 調整案 1: 魔道具を減らす検証 ---
        htmlContent += '<h4>1. 他のキャラの魔道具を減らす調整案</h4>';
        const nonTargets = allResults.filter(c => c.id !== target.id);
        let foundMagicToolAdjustment = false;

        nonTargets.forEach(otherChar => {
            const { A, B, C, D, E, G } = otherChar.rawInputs;
            
            // 魔道具2(D)を0にする
            if (D > 0) {
                const result = calculateHP(A, B, C, 0, E, G);
                if (result.ratio > target.ratio) {
                    htmlContent += `<p class="adjustment-success">🎉 成功! ${otherChar.name} の **魔道具2 (D)** の値を **0** に減らすと、${target.name} が最下位になります。</p>`;
                    foundMagicToolAdjustment = true;
                }
            }

            // 魔道具1(C)を0にする (Dが0でない場合は Dはそのまま)
            if (C > 0) {
                 // Dの値がまだ残っている場合のシミュレーション
                 const d_val = D > 0 ? D : 0; 
                 const result = calculateHP(A, B, 0, d_val, E, G);
                 if (result.ratio > target.ratio) {
                     htmlContent += `<p class="adjustment-success">🎉 成功! ${otherChar.name} の **魔道具1 (C)** の値を **0** に減らすと、${target.name} が最下位になります。</p>`;
                     foundMagicToolAdjustment = true;
                 }
            }
        });

        if (!foundMagicToolAdjustment) {
            htmlContent += '<p class="adjustment-fail">魔道具を一つ減らすだけでは、ターゲットを最下位にすることはできませんでした。</p>';
        }

        // --- 調整案 2: 他のキャラの基礎HPを上げる ---
        htmlContent += '<h4>2. 他のキャラの基礎HPを上げる調整案</h4>';
        
        nonTargets.forEach(otherChar => {
            const { B, C, D, E, G } = otherChar.rawInputs;
            const currentRatio = otherChar.ratio;
            
            // 目標比率はターゲットよりわずかに高く設定 (ターゲットが最下位になるように)
            const targetRatio = target.ratio + 0.0001; 

            // 基礎HP(A)をどれだけ増やせば目標比率に到達するかを探索
            let minA = otherChar.A;
            let maxA = 1000000;
            let finalA = otherChar.A;
            
            for (let i = 0; i < 100; i++) {
                const midA = (minA + maxA) / 2;
                const ratioCheck = calculateHP(midA, B, C, D, E, G).ratio; 
                
                if (ratioCheck < targetRatio) {
                    minA = midA;
                } else {
                    maxA = midA;
                }
                finalA = midA;
            }
            
            const A_increase = finalA - otherChar.A;
            const displayAIncrease = Math.ceil(A_increase);
            
            if (A_increase > 0 && displayAIncrease < 500000) { // 増加量が現実的でない場合は除外
                 htmlContent += `<p>👉 ${otherChar.name} の **基礎HP (A)** を **約 +${displayAIncrease.toLocaleString()}** 増加させると、${target.name} が最下位になります。</p>`;
            } else {
                 htmlContent += `<p>👉 ${otherChar.name} の基礎HPを上げても、他のパラメータを下げないと ${target.name} を最下位にすることは非常に困難です。</p>`;
            }
        });
    }

    return htmlContent;
}


// ページ読み込み時に、5キャラ分の入力欄を自動生成
document.addEventListener('DOMContentLoaded', () => {
    const inputContainer = document.getElementById('character-inputs');
    
    // 入力フォームのラベルとデフォルト値
    const fields = [
        { id: 'A', label: '基礎HP (A)', value: '' },       // ⑥ 空欄
        { id: 'B', label: 'オーバーヒール (B) (%)', value: 20 }, // ⑥ 20
        { id: 'C', label: '魔道具1 (C) (%)', value: 5 },  // ⑥ 5
        { id: 'D', label: '魔道具2 (D) (%)', value: 5 },  // ⑥ 5
        { id: 'G', label: 'その他 (G) (%)', value: 0 },   // ⑥ 0
        { id: 'E', label: '魔力回路 (E)', value: '' },      // ⑥ 空欄
    ];
    
    // ① 入力フォームの表示順
    const displayOrder = ['A', 'B', 'C', 'D', 'G', 'E'];
    const orderedFields = displayOrder.map(id => fields.find(f => f.id === id));


    for (let i = 1; i <= 5; i++) {
        const charDiv = document.createElement('div');
        charDiv.className = 'character-card';
        
        let cardContent = `<h3>キャラクター ${i}</h3>`;
        
        orderedFields.forEach(field => {
            // value属性にデフォルト値を設定
            cardContent += `
                <label>${field.label}: 
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