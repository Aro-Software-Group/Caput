// Analysis & Data Tools
class AnalysisTools {
  constructor() {
    this.category = 'analysis';
  }

  async chartBuilder(params) {
    const { data, type = 'bar', title = 'Chart', colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30'] } = params;
    
    await this.simulateDelay(1500, 3000);
    
    let svg = '';
    
    if (type === 'bar') {
      svg = this.generateBarChart(data, title, colors);
    } else if (type === 'line') {
      svg = this.generateLineChart(data, title, colors);
    } else if (type === 'pie') {
      svg = this.generatePieChart(data, title, colors);
    }
    
    return {
      svg: svg,
      type: type,
      title: title,
      dataPoints: Array.isArray(data) ? data.length : 4,
      generatedAt: new Date().toISOString()
    };
  }

  generateBarChart(data, title, colors) {
    const width = 500;
    const height = 300;
    const margin = { top: 50, right: 30, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const sampleData = data || [
      { label: 'A', value: 30 },
      { label: 'B', value: 45 },
      { label: 'C', value: 20 },
      { label: 'D', value: 35 }
    ];
    
    const maxValue = Math.max(...sampleData.map(d => d.value));
    const barWidth = chartWidth / sampleData.length * 0.8;
    const spacing = chartWidth / sampleData.length * 0.2;
    
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="white"/>
  <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">${title}</text>
  <g transform="translate(${margin.left}, ${margin.top})">
    ${sampleData.map((d, i) => {
      const barHeight = (d.value / maxValue) * chartHeight;
      const x = i * (barWidth + spacing);
      const y = chartHeight - barHeight;
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
              fill="${colors[i % colors.length]}" opacity="0.8"/>
        <text x="${x + barWidth/2}" y="${chartHeight + 20}" text-anchor="middle" 
              font-family="Arial" font-size="12">${d.label}</text>
        <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" 
              font-family="Arial" font-size="10" fill="#666">${d.value}</text>
      `;
    }).join('')}
    <line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}" stroke="#333" stroke-width="1"/>
    <line x1="0" y1="0" x2="0" y2="${chartHeight}" stroke="#333" stroke-width="1"/>
  </g>
</svg>`;
  }

  generateLineChart(data, title, colors) {
    const width = 500;
    const height = 300;
    const margin = { top: 50, right: 30, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const sampleData = data || [
      { x: 0, y: 20 },
      { x: 1, y: 35 },
      { x: 2, y: 30 },
      { x: 3, y: 45 },
      { x: 4, y: 40 }
    ];
    
    const maxY = Math.max(...sampleData.map(d => d.y));
    const maxX = Math.max(...sampleData.map(d => d.x));
    
    const points = sampleData.map(d => {
      const x = (d.x / maxX) * chartWidth;
      const y = chartHeight - (d.y / maxY) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="white"/>
  <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">${title}</text>
  <g transform="translate(${margin.left}, ${margin.top})">
    <polyline points="${points}" stroke="${colors[0]}" stroke-width="3" fill="none"/>
    ${sampleData.map(d => {
      const x = (d.x / maxX) * chartWidth;
      const y = chartHeight - (d.y / maxY) * chartHeight;
      return `<circle cx="${x}" cy="${y}" r="4" fill="${colors[0]}"/>`;
    }).join('')}
    <line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}" stroke="#333" stroke-width="1"/>
    <line x1="0" y1="0" x2="0" y2="${chartHeight}" stroke="#333" stroke-width="1"/>
  </g>
</svg>`;
  }

  generatePieChart(data, title, colors) {
    const width = 400;
    const height = 400;
    const radius = 150;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const sampleData = data || [
      { label: 'A', value: 30 },
      { label: 'B', value: 25 },
      { label: 'C', value: 20 },
      { label: 'D', value: 25 }
    ];
    
    const total = sampleData.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = 0;
    
    const slices = sampleData.map((d, i) => {
      const percentage = d.value / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
      const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
      const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
      const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      currentAngle += angle;
      
      return `<path d="${pathData}" fill="${colors[i % colors.length]}" opacity="0.8"/>`;
    }).join('');
    
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="white"/>
  <text x="${width/2}" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">${title}</text>
  ${slices}
</svg>`;
  }

  async dataframeCleaner(params) {
    const { data, operations = ['remove_nulls', 'fix_types', 'remove_duplicates'] } = params;
    
    await this.simulateDelay(2000, 4000);
    
    // Simulate data cleaning operations
    const cleaningResults = {
      original_rows: 1000,
      cleaned_rows: 950,
      operations_performed: operations,
      issues_found: {
        null_values: 35,
        duplicate_rows: 15,
        type_mismatches: 8,
        outliers: 12
      },
      cleaning_summary: operations.map(op => {
        switch(op) {
          case 'remove_nulls':
            return '空値35件を削除しました';
          case 'fix_types':
            return 'データ型不整合8件を修正しました';
          case 'remove_duplicates':
            return '重複行15件を削除しました';
          default:
            return `${op}処理を実行しました`;
        }
      }),
      recommendations: [
        '外れ値の確認をお勧めします',
        'カテゴリ変数のエンコーディングを検討してください',
        '特徴量の正規化が必要な場合があります'
      ]
    };
    
    return cleaningResults;
  }

  async correlationAnalyzer(params) {
    const { data, method = 'pearson' } = params;
    
    await this.simulateDelay(1500, 3000);
    
    // Generate sample correlation matrix
    const variables = ['売上', '広告費', '従業員数', '店舗数'];
    const correlationMatrix = [];
    
    for (let i = 0; i < variables.length; i++) {
      const row = [];
      for (let j = 0; j < variables.length; j++) {
        if (i === j) {
          row.push(1.0);
        } else {
          // Generate realistic correlation values
          row.push(Math.random() * 1.8 - 0.9);
        }
      }
      correlationMatrix.push(row);
    }
    
    // Generate heatmap SVG
    const heatmapSvg = this.generateCorrelationHeatmap(variables, correlationMatrix);
    
    return {
      correlation_matrix: correlationMatrix,
      variables: variables,
      method: method,
      heatmap_svg: heatmapSvg,
      insights: this.generateCorrelationInsights(variables, correlationMatrix),
      strongest_correlation: this.findStrongestCorrelation(variables, correlationMatrix)
    };
  }

  generateCorrelationHeatmap(variables, matrix) {
    const size = 300;
    const cellSize = size / variables.length;
    
    let svg = `<svg width="${size + 100}" height="${size + 100}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size + 100}" height="${size + 100}" fill="white"/>
      <text x="${size/2 + 50}" y="20" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">相関ヒートマップ</text>`;
    
    // Draw cells
    for (let i = 0; i < variables.length; i++) {
      for (let j = 0; j < variables.length; j++) {
        const correlation = matrix[i][j];
        const intensity = Math.abs(correlation);
        const color = correlation > 0 ? 
          `rgb(${255-Math.floor(intensity*200)}, ${255-Math.floor(intensity*100)}, 255)` :
          `rgb(255, ${255-Math.floor(intensity*100)}, ${255-Math.floor(intensity*200)})`;
        
        const x = j * cellSize + 50;
        const y = i * cellSize + 50;
        
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}" stroke="white"/>`;
        svg += `<text x="${x + cellSize/2}" y="${y + cellSize/2 + 3}" text-anchor="middle" font-size="10" fill="black">${correlation.toFixed(2)}</text>`;
      }
      
      // Add row labels
      svg += `<text x="40" y="${i * cellSize + 50 + cellSize/2 + 3}" text-anchor="end" font-size="10">${variables[i]}</text>`;
    }
    
    // Add column labels
    for (let j = 0; j < variables.length; j++) {
      svg += `<text x="${j * cellSize + 50 + cellSize/2}" y="45" text-anchor="middle" font-size="10">${variables[j]}</text>`;
    }
    
    svg += '</svg>';
    return svg;
  }

  generateCorrelationInsights(variables, matrix) {
    const insights = [];
    
    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const correlation = matrix[i][j];
        if (Math.abs(correlation) > 0.7) {
          const strength = Math.abs(correlation) > 0.9 ? '非常に強い' : '強い';
          const direction = correlation > 0 ? '正の' : '負の';
          insights.push(`${variables[i]}と${variables[j]}の間に${strength}${direction}相関があります (${correlation.toFixed(3)})`);
        }
      }
    }
    
    return insights.length > 0 ? insights : ['統計的に有意な相関は見つかりませんでした'];
  }

  findStrongestCorrelation(variables, matrix) {
    let strongest = { value: 0, pair: [] };
    
    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        if (Math.abs(matrix[i][j]) > Math.abs(strongest.value)) {
          strongest = {
            value: matrix[i][j],
            pair: [variables[i], variables[j]]
          };
        }
      }
    }
    
    return strongest;
  }

  async timeSeriesForecaster(params) {
    const { data, periods = 12, method = 'linear_trend' } = params;
    
    await this.simulateDelay(3000, 5000);
    
    // Generate sample time series data
    const historicalData = [];
    const baseValue = 1000;
    const trend = 50;
    const seasonality = 100;
    
    for (let i = 0; i < 24; i++) {
      const value = baseValue + 
        trend * i + 
        seasonality * Math.sin(2 * Math.PI * i / 12) + 
        (Math.random() - 0.5) * 200;
      
      historicalData.push({
        period: i + 1,
        value: Math.round(value),
        date: new Date(2024, i % 12, 1).toISOString().split('T')[0]
      });
    }
    
    // Generate forecast
    const forecast = [];
    for (let i = 0; i < periods; i++) {
      const futureValue = baseValue + 
        trend * (24 + i) + 
        seasonality * Math.sin(2 * Math.PI * (24 + i) / 12);
      
      forecast.push({
        period: 24 + i + 1,
        value: Math.round(futureValue),
        confidence_lower: Math.round(futureValue * 0.9),
        confidence_upper: Math.round(futureValue * 1.1),
        date: new Date(2026, i % 12, 1).toISOString().split('T')[0]
      });
    }
    
    // Generate forecast chart
    const chartSvg = this.generateForecastChart(historicalData, forecast);
    
    return {
      historical_data: historicalData,
      forecast: forecast,
      method: method,
      periods: periods,
      chart_svg: chartSvg,
      accuracy_metrics: {
        mape: '8.5%',
        rmse: 156.7,
        r_squared: 0.89
      },
      insights: [
        '明確な上昇トレンドが確認できます',
        '季節性パターンが存在します',
        '予測精度は良好です（R²=0.89）'
      ]
    };
  }

  generateForecastChart(historical, forecast) {
    const width = 600;
    const height = 300;
    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const allData = [...historical, ...forecast];
    const minValue = Math.min(...allData.map(d => d.confidence_lower || d.value));
    const maxValue = Math.max(...allData.map(d => d.confidence_upper || d.value));
    const valueRange = maxValue - minValue;
    
    // Generate historical line
    const historicalPoints = historical.map((d, i) => {
      const x = (i / (allData.length - 1)) * chartWidth;
      const y = chartHeight - ((d.value - minValue) / valueRange) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    // Generate forecast line
    const forecastPoints = forecast.map((d, i) => {
      const x = ((historical.length + i) / (allData.length - 1)) * chartWidth;
      const y = chartHeight - ((d.value - minValue) / valueRange) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="white"/>
  <text x="${width/2}" y="20" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">時系列予測</text>
  <g transform="translate(${margin.left}, ${margin.top})">
    <polyline points="${historicalPoints}" stroke="#007AFF" stroke-width="2" fill="none"/>
    <polyline points="${forecastPoints}" stroke="#FF9500" stroke-width="2" fill="none" stroke-dasharray="5,5"/>
    <line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}" stroke="#333" stroke-width="1"/>
    <line x1="0" y1="0" x2="0" y2="${chartHeight}" stroke="#333" stroke-width="1"/>
    <text x="${chartWidth/2}" y="${chartHeight + 40}" text-anchor="middle" font-size="12">期間</text>
    <text x="-30" y="${chartHeight/2}" text-anchor="middle" font-size="12" transform="rotate(-90, -30, ${chartHeight/2})">値</text>
    <text x="${chartWidth - 50}" y="20" font-size="10" fill="#007AFF">実績</text>
    <text x="${chartWidth - 50}" y="35" font-size="10" fill="#FF9500">予測</text>
  </g>
</svg>`;
  }

  async simulateDelay(min = 1000, max = 3000) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.AnalysisTools = AnalysisTools;
}
