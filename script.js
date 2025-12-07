// --- ⚙️ 計算のメイン関数 ---
// 変数名: 基礎HP(A), オーバーヒール(B), 魔道具1(C), 魔道具2(D), 魔力回路(E), その他(G)
function calculateHP(A, B, C, D, E, G) {
    // B%, C%, D%, G% を「率」に変換
    const B_rate = B / 100;
    const C_rate = C / 100;
    const D_rate = D / 100;
    const G_rate = G / 100;

    // Aが0の場合の割り算エラー防止
    if (A < 1) A = 1; 

    // --- 計算式の実行（かけ算するたびに切り捨て Math.floor() を使用） ---

    // 1. 第一項: {A × (100% + B%)} ←切り捨て
    const term1 = Math.floor(A * (1 + B_rate)); 

    // 2. 第二項: 魔道具1(C) の項
    const temp_c1 = Math.floor(A * (1 + C_rate));
    const temp_c2 = temp_c1 - A;
    const term2 = Math.floor(temp_c2 * (1 + B_rate)); 

    // 3. 第三項: 魔道具2(D) の項 
    const temp_d1 = Math.floor(A * (1 + D_rate));
    const temp_d2 = temp_d1 - A;
    const term3 = Math.floor(temp_d2 * (1 + B_rate)); 

    // 4. 第四項: その他(G) の項 (新設)
    const temp_g1 = Math.floor(A * (1 + G_rate));
    const temp_g2 = temp_g1 - A;
    const term4 = Math.floor(temp_g2 * (1 + B_rate)); 

    // 5. 第五項: E × B% ←切り捨て
    const term5 = Math.floor(E * B_rate);

    // 6. 最終的なHP (F)
    const F = term1 + term2 + term3 + term4 + term5;

    // 7. HP割合 (F/A) - 比較に使用
    const ratio = F / A;

    return { F, ratio };
}

// --- 📊 全キャラ計算と比較結果表示の関数 ---
function calculateAndCompare() {
    const totalChars = 5;
    const allResults = [];
    
    // ② 共通のオーバーヒール(B)を取得
    const B_common = parseFloat(document.getElementById('B_common').value) || 0;

    // ⑤ 2箇所以上埋まっていれば比較するためのフラグ
    let validCharCount = 0;

    for (let i = 1; i <= totalChars; i++) {
        const A = parseFloat(document.getElementById(`A${i}`).value) || 0; // ⑥ デフォルト空欄のため0として扱う
        const C = parseFloat(document.getElementById(`C${i}`).value) || 0;
        const D = parseFloat(document.getElementById(`D${i}`).value) || 0;
        const E = parseFloat(document.getElementById(`E${i}`).value) || 0; // ⑥ デフォルト空欄のため0として扱う
        const G = parseFloat(document.getElementById(`G${i}`).value) || 0;

        // ⑤ 基礎HP(A)以外の入力が1つでもあれば有効とみなす (Aが空欄でもC, D, E, Gがあれば計算対象)
        // 厳密には「2箇所以上」ではないが、何かしら入力があれば計算する仕様が一般的
        const hasInputs = (A > 0) || (C > 0) || (D > 0) || (E > 0) || (G > 0);
        
        if (hasInputs) {
            validCharCount++;
            // 計算実行（Bは共通値を使用）
            const { F, ratio } = calculateHP(A, B_common, C, D, E, G);

            allResults.push({
                name: `キャラクター ${i}`,
                A: A,
                F: F,
                ratio: ratio,
                rawInputs: { C, D, E, G } // 猶予計算のためにC, D, E, Gを保存
            });
        }
    }

    // 比較に必要なデータがない場合は終了
    if (validCharCount < 2) {
        document.getElementById('results-container').innerHTML = '<p class="gap-info">計算には最低2体分のキャラクターデータが必要です。</p>';
        return;
    }
    
    // 順位付け (現在HP, HP割合)
    const ratioRanked = [...allResults].sort((a, b) => a.ratio - b.ratio);
    const hpRanked = [...allResults].sort((a, b) => b.F - a.F); // Fが大きい順（高い順）

    let htmlContent = '';

    // ③ 現在HPのランキング
    htmlContent += '<h3>🏆 順位 (現在HP F のみ)</h3>';
    htmlContent += generateRankTable(hpRanked, 'F');
    
    // ③ HP割合のランキング (F/A)
    htmlContent += '<h3>🏆 順位 (HP割合 F/A のみ)</h3>';
    htmlContent += generateRankTable(ratioRanked, 'ratio');
    
    // 猶予の計算と表示
    htmlContent += calculateAndDisplayGap(ratioRanked, B_common);

    // 結果をHTMLの所定の場所に出力
    document.getElementById('results-container').innerHTML = htmlContent;
}

// 順位テーブルを生成するヘルパー関数
function generateRankTable(data, sortKey) {
    let table = '<table><tr><th>順位</th><th>キャラ名</th><th>基礎HP (A)</th><th>現在HP (F)</th><th>HP割合 (F/A)</th></tr>';
    
    data.forEach((char, index) => {
        const rank = index + 1;
        const displayValue = sortKey === 'F' ? char.F.toLocaleString() : char.ratio.toFixed(4);
        const rankClass = sortKey === 'ratio' && rank === 1 ? 'rank-min' : '';

        table += `
            <tr class="${rankClass}">
                <td>${rank}</td>
                <td>${char.name}</td>
                <td>${char.A.toLocaleString()}</td>
                <td>${char.F.toLocaleString()}</td>
                <td>${char.ratio.toFixed(4)}</td>
            </tr>
        `;
    });
    table += '</table>';
    return table;
}

// ④ 猶予（基礎HPの増加量）を計算する関数
function calculateAndDisplayGap(ratioRanked, B_common) {
    const lowest = ratioRanked[0]; // 最下位 (F/Aが最も低い)
    const secondLowest = ratioRanked[1]; // 2番目に低いキャラ
    
    if (!secondLowest) return '';

    const targetRatio = secondLowest.ratio; // 2位のHP割合を目標とする
    
    // 現在の最低キャラの基礎HP(A)をどれだけ増やせば2位と同じHP割合になるか？
    
    // 目標値 (F/A = targetRatio) より F = A * targetRatio
    // A'を目標の基礎HPとする
    // F' = calculateHP(A', B, C, D, E, G).F
    // F' / A' = targetRatio を満たす A' を探す。
    
    // 計算が複雑なので、目標とするHP割合に到達するAを二分探索で探す (専門用語でごめんなさい)
    // 要は、Aの値を少しずつ変えて、F/AがtargetRatioになる点を探します。
    
    const { C, D, E, G } = lowest.rawInputs;
    let minA = lowest.A;
    let maxA = 50000; // 探索上限（十分大きい値）
    let targetA = lowest.A;
    
    // 100回試行（十分正確な値が出る）
    for (let i = 0; i < 100; i++) {
        const midA = (minA + maxA) / 2;
        const currentRatio = calculateHP(midA, B_common, C, D, E, G).ratio;

        if (currentRatio < targetRatio) {
            minA = midA;
        } else {
            maxA = midA;
        }
        targetA = midA;
    }

    const A_increase = targetA - lowest.A;
    const displayAIncrease = Math.ceil(A_increase); // 切り上げて表示

    let htmlContent = `
        <h3>⭐ 最下位キャラの猶予（HP割合基準）</h3>
        <p><strong>最下位:</strong> ${lowest.name} (F/A: ${lowest.ratio.toFixed(4)})</p>
        <p><strong>2位:</strong> ${secondLowest.name} (F/A: ${secondLowest.ratio.toFixed(4)})</p>
        <p class="gap-info">
            最下位の ${lowest.name} が2位 (${secondLowest.name}) と同等のHP割合になるには、<br>
            現在の基礎HP (${lowest.A.toLocaleString()}) から **約 +${displayAIncrease.toLocaleString()}** の<br>
            **基礎HP (A)** を追加で確保する必要があります。
        </p>
    `;
    return htmlContent;
}


// ページ読み込み時に、5キャラ分の入力欄を自動生成
document.addEventListener('DOMContentLoaded', () => {
    const inputContainer = document.getElementById('character-inputs');
    
    // ① 入力フォームのラベルとデフォルト値
    const fields = [
        { id: 'A', label: '基礎HP (A)', value: '' }, // ⑥ 基礎HPは空欄
        { id: 'C', label: '魔道具1 (C) (%)', value: 5 }, // ⑥ 魔道具1は5%
        { id: 'D', label: '魔道具2 (D) (%)', value: 5 }, // ⑥ 魔道具2は5%
        { id: 'G', label: 'その他 (G) (%)', value: 0 }, // ⑦ その他(G)を追加
        { id: 'E', label: '魔力回路 (E)', value: '' }, // ⑥ 魔力回路は空欄
    ];

    for (let i = 1; i <= 5; i++) {
        const charDiv = document.createElement('div');
        charDiv.className = 'character-card';
        
        let cardContent = `<h3>キャラクター ${i}</h3>`;
        
        fields.forEach(field => {
            // AとEは空欄、C, Dは5、Gは0
            let defaultValue = field.value;
            if (field.value === '') {
                defaultValue = '';
            } else if (field.id === 'A' || field.id === 'E') {
                 // AとEの初期値は空欄 (数値型なので空欄は非推奨だが、要望通りに)
                 defaultValue = ''; 
            } else {
                defaultValue = field.value;
            }

            cardContent += `
                <label>${field.label}: 
                    <input type="number" id="${field.id}${i}" value="${defaultValue}" min="0">
                </label>
            `;
        });

        charDiv.innerHTML = cardContent;
        inputContainer.appendChild(charDiv);
    }
    
    // 初回ロード時に計算を実行
    calculateAndCompare();
});