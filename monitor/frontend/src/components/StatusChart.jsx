import React, { useEffect, useRef, useContext } from 'react';
import { Chart, registerables } from 'chart.js';
import { ThemeContext } from '../context/ThemeContext';

Chart.register(...registerables);

function StatusChart({ statuses }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    // Cleanup function to destroy the chart instance when the component unmounts
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Exit early if there's no data or the canvas is not available
    if (!statuses || statuses.length === 0 || !chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
      return;
    }

    const sortedStatuses = [...statuses].sort((a, b) => a.checked_at - b.checked_at);
    const labels = sortedStatuses.map(status => {
      const date = new Date(status.checked_at * 1000);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    const responseTimeData = sortedStatuses.map(status =>
      status.is_up ? status.response_time_ms : null
    );

    const ctx = chartRef.current.getContext('2d');
    
    // Create a gradient for the chart area fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    const primaryColor = darkMode ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)';
    const transparentPrimary = darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.1)';
    
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, transparentPrimary);

    if (chartInstance.current) {
      // If the chart already exists, just update the data and styling
      chartInstance.current.data.labels = labels;
      chartInstance.current.data.datasets[0].data = responseTimeData;
      chartInstance.current.data.datasets[0].backgroundColor = gradient;
      chartInstance.current.data.datasets[0].borderColor = primaryColor;
      
      // Update scales for theme changes
      chartInstance.current.options.scales.x.grid.color = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
      chartInstance.current.options.scales.x.ticks.color = darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
      chartInstance.current.options.scales.y.grid.color = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
      chartInstance.current.options.scales.y.ticks.color = darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';

      chartInstance.current.update();
    } else {
      // Create a new chart instance
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Response Time (ms)',
              data: responseTimeData,
              fill: true,
              backgroundColor: gradient,
              borderColor: primaryColor,
              borderWidth: 2,
              tension: 0.4, // Makes the line smooth
              pointRadius: 3,
              pointHoverRadius: 6,
              pointBackgroundColor: 'white',
              pointBorderColor: primaryColor,
              pointBorderWidth: 2,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000
          },
          scales: {
            x: {
              grid: {
                color: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                drawBorder: false,
              },
              ticks: {
                color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                maxRotation: 0,
                minRotation: 0,
                font: { size: 10 }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                drawBorder: false,
              },
              ticks: {
                color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                font: { size: 10 }
              }
            }
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: darkMode ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              titleColor: darkMode ? '#ffffff' : '#000000',
              bodyColor: darkMode ? '#e2e8f0' : '#475569',
              borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderWidth: 1,
              cornerRadius: 8,
              titleFont: { weight: 'bold' },
              callbacks: {
                title: function(context) {
                  const date = new Date(sortedStatuses[context[0].dataIndex].checked_at * 1000);
                  return date.toLocaleString();
                },
                label: function(context) {
                  const status = sortedStatuses[context.dataIndex];
                  const lines = [];
                  lines.push(`Status: ${status.is_up ? 'Online' : 'Offline'}`);
                  if (status.is_up) {
                    lines.push(`Response Time: ${status.response_time_ms} ms`);
                  }
                  lines.push(`Status Code: ${status.status_code || 'N/A'}`);
                  return lines;
                },
                labelColor: function() {
                  return {
                    borderColor: primaryColor,
                    backgroundColor: primaryColor
                  };
                }
              }
            },
          },
        },
      });
    }
  }, [statuses, darkMode]);

  return (
    <div className="h-80">
      {statuses && statuses.length > 0 ? (
        <canvas ref={chartRef}></canvas>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No data available
          </p>
        </div>
      )}
    </div>
  );
}

export default StatusChart;