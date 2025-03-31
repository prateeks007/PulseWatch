import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

function StatusChart({ statuses, darkMode }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // Clean up function to destroy chart when component unmounts
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Make sure we have data and the canvas element is ready
    if (!statuses || statuses.length === 0 || !chartRef.current) {
      return;
    }

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Sort statuses by checked_at in ascending order
    const sortedStatuses = [...statuses].sort((a, b) => a.checked_at - b.checked_at);

    // Prepare data for the chart
    const labels = sortedStatuses.map(status => {
      // Format timestamp for display
      const date = new Date(status.checked_at * 1000);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    const responseTimeData = sortedStatuses.map(status => 
      status.is_up ? status.response_time_ms : null
    );

    // Get the canvas context
    const ctx = chartRef.current.getContext('2d');

    // Create a new chart instance
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Response Time (ms)',
            data: responseTimeData,
            fill: false,
            borderColor: darkMode ? 'rgba(59, 130, 246, 0.8)' : 'rgba(37, 99, 235, 0.8)',
            backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.2)',
            tension: 0.1,
            pointBackgroundColor: sortedStatuses.map(status => 
              status.is_up === true ? (darkMode ? 'rgba(34, 197, 94, 1)' : 'rgba(22, 163, 74, 1)') : 
              status.is_up === false ? (darkMode ? 'rgba(239, 68, 68, 1)' : 'rgba(220, 38, 38, 1)') : 
              (darkMode ? 'rgba(250, 204, 21, 1)' : 'rgba(234, 179, 8, 1)')
            ),
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750
        },
        scales: {
          x: {
            grid: {
              color: darkMode ? 'rgba(200, 200, 200, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: darkMode ? 'rgba(200, 200, 200, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const index = context.dataIndex;
                const status = sortedStatuses[index];
                const responseTime = status.response_time_ms;
                const isUp = status.is_up;
                
                let statusText = 'Unknown';
                if (isUp === true) statusText = 'Online';
                if (isUp === false) statusText = 'Offline';
                
                return [
                  `Status: ${statusText}`,
                  responseTime ? `Response Time: ${responseTime} ms` : 'No response time data'
                ];
              }
            }
          }
        }
      }
    });

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