// --- ⚙️ 計算のメイン関数 ---
// 変数名: 基礎HP(A), オーバーヒール(B), 魔道具1(C), 魔道具2(D), 魔力回路(E)
function calculateHP(A, B, C, D, E) {
    // B%, C%, D% を 0.10 や 0.20 のような「率」に変換
    const B_rate = B / 100;
    const C_rate = C / 100;
    const D_rate = D / 100;

    // --- 計算式の実行（かけ算するたびに切り捨て Math.floor() を使用） ---

    // 1. 第一項: {A × (100% + B%)} ←切り捨て
    const term1 = Math.floor(A * (1 + B_rate)); 

    // 2. 第二項: 魔道具1(C) の項
    // Step 2-1: {A × (100% + C%)} ←切り捨て
    const temp_c1 = Math.floor(A * (1 + C_rate));
    // Step 2-2: (Temp_c1 - A)
    const temp_c2 = temp_c1 - A;
    // Step 2-3: (Temp_c2 × (100% + B%)) ←切り捨て
    const term2 = Math.floor(temp_c2 * (1 + B_rate)); 

    // 3. 第三項: 魔道具2(D) の項 (構造は魔道具1と同じ)
    // Step 3-1: {A × (100% + D%)} ←切り捨て
    const temp_d1 = Math.floor(A * (1 + D_rate));
    // Step 3-2: (Temp_d1 - A)
    const temp_d2 = temp_d1 - A;
    // Step 3-3: (Temp_d2 × (100% + B%)) ←切り捨て
    const term3 = Math.floor(temp_d2 * (1 + B_rate)); 

    // 4. 第四項: E × B% ←切り捨て
    const term4 = Math.floor(E * B_rate);

    // 5. 最終的なHP (F)
    const F = term1 + term2 + term3 + term4;

    // 6. HP割合 (F/A) - 比較に使用
    const ratio = F / A;

    return { F, ratio };
}


// --- 📊 全キャラ計算と比較結果表示の関数 ---
function calculateAndCompare() {
    const totalChars = 5;
    const results = [];
    
    // 5キャラ分のデータを取得し、計算を実行
    for (let i = 1; i <= totalChars; i++) {
        // HTMLから入力値を取得
        // F/Aの解が最も低いキャラを調べるため、Aがゼロだと割り算できないため、Aが1以上であることを確認します
        const A = parseFloat(document.getElementById(`A${i}`).value) || 1; 
        const B = parseFloat(document.getElementById(`B${i}`).value) || 0;
        const C = parseFloat(document.getElementById(`C${i}`).value) || 0;
        const D = parseFloat(document.getElementById(`D${i}`).value) || 0;
        const E = parseFloat(document.getElementById(`E${i}`).value) || 0;

        // 計算
        const { F, ratio } = calculateHP(A, B, C, D, E);

        // 結果を配列に保存
        results.push({
            name: `キャラクター ${i}`,
            A: A,
            F: F,
            ratio: ratio
        });
    }

    // HP割合 (ratio) が低い順に並べ替えて順位を確定
    results.sort((a, b) => a.ratio - b.ratio);

    // --- 結果のHTML表示を準備 ---
    let htmlContent = '<table>';
    htmlContent += '<tr><th>順位</th><th>キャラ名</th><th>基礎HP (A)</th><th>現在HP (F)</th><th>HP割合 (F/A)</th><th>HP増加 (%)</th></tr>';
    
    results.forEach((char, index) => {
        const rank = index + 1;
        // HP増加率をパーセントで表示 (例: 1.25 -> 25.00%)
        const increasePercent = ((char.ratio - 1) * 100).toFixed(2); 
        const ratioDisplay = char.ratio.toFixed(4);

        htmlContent += `
            <tr class="${rank === 1 ? 'rank-min' : ''}">
                <td>${rank}</td>
                <td>${char.name}</td>
                <td>${char.A.toLocaleString()}</td>
                <td>${char.F.toLocaleString()}</td>
                <td>${ratioDisplay}</td>
                <td>+${increasePercent}%</td>
            </tr>
        `;
    });
    htmlContent += '</table>';
    
    // --- 最下位と2番目の比較 ---
    const lowest = results[0]; // 最下位 (F/Aが最も低い)
    const secondLowest = results[1]; // 2番目に低いキャラ
    
    if (results.length >= 2) {
        const gap = secondLowest.ratio - lowest.ratio; // 猶予
        htmlContent += `
            <h3>⭐ 比較結果（最下位キャラの猶予）</h3>
            <p><strong>最下位:</strong> ${lowest.name} (HP割合: ${lowest.ratio.toFixed(4)})</p>
            <p><strong>2位:</strong> ${secondLowest.name} (HP割合: ${secondLowest.ratio.toFixed(4)})</p>
            <p class="gap-info">
                2位とのHP割合の差（猶予）は **${gap.toFixed(4)}** です。<br>
                この値が0以下になると、最下位と2位のHP効率が同等または逆転します。
            </p>
        `;
    }

    // 結果をHTMLの所定の場所に出力
    document.getElementById('results-container').innerHTML = htmlContent;
}

// ページ読み込み時に、5キャラ分の入力欄を自動生成
document.addEventListener('DOMContentLoaded', () => {
    const inputContainer = document.getElementById('character-inputs');
    
    // 入力フォームのラベル順序指定
    const fields = [
        { id: 'A', label: '基礎HP', value: 5000 },
        { id: 'B', label: 'オーバーヒール(%)', value: 10 },
        { id: 'C', label: '魔道具1(%)', value: 20 },
        { id: 'D', label: '魔道具2(%)', value: 20 },
        { id: 'E', label: '魔力回路', value: 100 }, // Eが一番下に来るように配置
    ];

    for (let i = 1; i <= 5; i++) {
        const charDiv = document.createElement('div');
        charDiv.className = 'character-card';
        
        let cardContent = `<h3>キャラクター ${i}</h3>`;
        
        fields.forEach(field => {
            // AとEはパーセントではないので min=0 のみ
            const min_value = (field.id === 'A' || field.id === 'E') ? 'min="0"' : 'min="0"'; 
            
            cardContent += `
                <label>${field.label}: 
                    <input type="number" id="${field.id}${i}" value="${field.value + (i * 100)}" ${min_value}>
                </label>
            `;
        });

        charDiv.innerHTML = cardContent;
        inputContainer.appendChild(charDiv);
    }
    
    // 初回ロード時に計算を実行 (任意)
    calculateAndCompare();
});