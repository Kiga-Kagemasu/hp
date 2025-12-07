// --- ⚙️ 計算のメイン関数 ---
// キャラクター1体分のデータを受け取り、HP (F) と HP割合 (F/A) を計算します
function calculateHP(A, B, C, D, E) {
    // B% と C% を 0.10 や 0.20 のような「率」に変換
    const B_rate = B / 100;
    const C_rate = C / 100;

    // --- 計算式の実行（かけ算するたびに切り捨て Math.floor() を使用） ---

    // 1. 第一項: {A × (100% + B%)} ←切り捨て
    const term1 = Math.floor(A * (1 + B_rate)); 

    // 2. 第二項 (内部計算)
    // Step 1: {A × (100% + C%)} ←切り捨て
    const temp1 = Math.floor(A * (1 + C_rate));
    
    // Step 2: (Temp1 - A)
    const temp2 = temp1 - A;

    // Step 3: (Temp2 × (100% + B%)) ←切り捨て
    const temp3 = Math.floor(temp2 * (1 + B_rate));

    // Step 4: Term2 = Temp3 × D
    // Dは整数(0, 1, 2)なのでここでは切り捨て不要
    const term2 = temp3 * D; 

    // 3. 第三項: E × B% ←切り捨て
    const term3 = Math.floor(E * B_rate);

    // 4. 最終的なHP (F)
    const F = term1 + term2 + term3;

    // 5. HP割合 (F/A) - これが比較に使う値
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
        const A = parseFloat(document.getElementById(`A${i}`).value) || 0;
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
    // a.ratio - b.ratio とすると昇順（小さい順）になる
    results.sort((a, b) => a.ratio - b.ratio);

    // --- 結果のHTML表示を準備 ---
    let htmlContent = '<table>';
    htmlContent += '<tr><th>順位</th><th>キャラ名</th><th>基本HP (A)</th><th>最終HP (F)</th><th>HP割合 (F/A)</th><th>HP増加 (%)</th></tr>';
    
    results.forEach((char, index) => {
        const rank = index + 1;
        // HP増加率をパーセントで表示 (例: 1.25 -> 25.00%)
        const increasePercent = ((char.ratio - 1) * 100).toFixed(2); 
        const ratioDisplay = char.ratio.toFixed(4);

        htmlContent += `
            <tr class="${rank === 1 ? 'rank-min' : ''}">
                <td>${rank}</td>
                <td>${char.name}</td>
                <td>${char.A}</td>
                <td>${char.F}</td>
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
                この値が0になると、2位のキャラとHP効率が同等になります。
            </p>
        `;
    }

    // 結果をHTMLの所定の場所に出力
    document.getElementById('results-container').innerHTML = htmlContent;
}

// ページ読み込み時に、5キャラ分の入力欄を自動生成（ステップ1のHTMLの改良）
document.addEventListener('DOMContentLoaded', () => {
    const inputContainer = document.getElementById('character-inputs');
    inputContainer.innerHTML = ''; // テンプレートの初期値をクリア
    
    for (let i = 1; i <= 5; i++) {
        const charDiv = document.createElement('div');
        charDiv.className = 'character-card';
        charDiv.innerHTML = `
            <h3>キャラクター ${i}</h3>
            <label>A (基本HP): <input type="number" id="A${i}" value="${1000 + i * 100}" min="1"></label>
            <label>B (%) (バフ率): <input type="number" id="B${i}" value="${10 + i}" min="0"></label>
            <label>C (%) (特性率): <input type="number" id="C${i}" value="${20 + i * 2}" min="0"></label>
            <label>D (係数 0,1,2): <input type="number" id="D${i}" value="${i % 3}" min="0" max="2"></label>
            <label>E (補正値): <input type="number" id="E${i}" value="${50 + i * 5}" min="0"></label>
        `;
        inputContainer.appendChild(charDiv);
    }
});