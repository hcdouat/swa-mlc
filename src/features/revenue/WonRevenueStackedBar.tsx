import { Card, CardContent, Typography, Box, Grid } from "@mui/material";
import { useState, useEffect, useMemo, memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { aggregateWonByMonthAndFunnel } from "./aggregateWonByMonthAndFunnel";

const FUNNEL_COLORS = [
  "#1976d2",
  "#9c27b0",
  "#2e7d32",
  "#ed6c02",
  "#d32f2f",
  "#0288d1",
];

const TARGET_PER_FUNNEL = 600000;

// Separate clock component to prevent re-renders
function LiveClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h4" fontWeight="bold">
        {currentTime.toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
        {' - '}
        {currentTime.toLocaleTimeString('pt-BR')}
      </Typography>
    </Box>
  );
}

export function WonRevenueStackedBar({ deals }: { deals: any[] }) {
  const { data, funnels } = aggregateWonByMonthAndFunnel(deals, "data_fechamento");

  // Calculate totals for each month
  const dataWithTotals = useMemo(() => data.map(item => ({
    ...item,
    total: funnels.reduce((sum, funnel) => sum + ((item as any)[funnel] || 0), 0)
  })), [data, funnels]);

  const renderCustomLabel = useMemo(() => (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#000"
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
      >
        {value?.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 0,
        })}
      </text>
    );
  }, []);

  // Get current month data
  const now = useMemo(() => new Date(), []);
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const proratedTarget = (TARGET_PER_FUNNEL / daysInMonth) * currentDay;
  
  console.log('=== DEBUGGING CURRENT MONTH ===');
  console.log('Current month:', currentMonth);
  console.log('Current day:', currentDay, 'of', daysInMonth);
  console.log('Prorated target:', proratedTarget);

  const currentMonthDeals = useMemo(() => deals.filter(d => {
    const date = new Date(d.data_fechamento);
    const dealMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return dealMonth === currentMonth && d.status === 'Ganha';
  }), [deals, currentMonth]);
  
  console.log('Current month deals count:', currentMonthDeals.length);

  const funnelPerformance = useMemo(() => funnels.map((funnel, index) => {
    const funnelDeals = currentMonthDeals.filter(d => {
      const pipelineName = d.pipeline_name || d.pipeline || d.funil || d.nome_funil;
      return pipelineName === funnel;
    });
    
    const total = funnelDeals.reduce((sum, d) => {
      const recorrente = Number(d.valor_recorrente) || 0;
      const naoRecorrente = Number(d.valor_nao_recorrente) || 0;
      const valorTotal = Number(d.valor) || 0;
      return sum + (valorTotal || (recorrente + naoRecorrente));
    }, 0);
    
    const percentage = Math.min((total / TARGET_PER_FUNNEL) * 100, 100);
    const proratedPercentage = Math.min((proratedTarget / TARGET_PER_FUNNEL) * 100, 100);
    
    return {
      funnel,
      actual: total,
      target: TARGET_PER_FUNNEL,
      proratedTarget,
      percentage,
      proratedPercentage,
      fill: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
    };
  }), [funnels, currentMonthDeals, proratedTarget]);

  const funnelPipelineData = useMemo(() => funnels.map((funnel) => {
    const funnelDeals = deals.filter(d => {
      const pipelineName = d.funil || d.pipeline_name || d.pipeline || d.nome_funil;
      return pipelineName === funnel && d.status === 'Em andamento';
    });

    const grouped = funnelDeals.reduce((acc: any, deal) => {
      const stage = deal.estagio || 'Sem estágio';
      const key = stage;

      if (!acc[key]) {
        acc[key] = {
          stage,
          ordem_estagio: deal.ordem_estagio || 999,
          count: 0,
          valor_recorrente: 0,
          valor_nao_recorrente: 0,
        };
      }

      acc[key].count += 1;
      acc[key].valor_recorrente += Number(deal.valor_recorrente) || 0;
      acc[key].valor_nao_recorrente += Number(deal.valor_nao_recorrente) || 0;

      return acc;
    }, {});

    const pipeline = Object.values(grouped).sort((a: any, b: any) => 
      (a.ordem_estagio || 999) - (b.ordem_estagio || 999)
    );

    return {
      funnel,
      pipeline,
    };
  }), [funnels, deals]);

  return (
    <>
      <LiveClock />

      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Vendas por mês por funil de vendas
      </Typography>

      <Card sx={{ width: '100%', maxWidth: '100%' }}>
        <CardContent sx={{ width: '100%', '&:last-child': { pb: 2 } }}>

          <div style={{ width: "100%", height: "50vh" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataWithTotals}>
                <XAxis dataKey="month" />
                <Tooltip
                  formatter={(v: number | undefined) =>
                    v?.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }) ?? ""
                  }
                />
                <Legend />
                {funnels.map((f, i) => (
                  <Bar
                    key={f}
                    dataKey={f}
                    stackId="a"
                    fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]}
                  >
                    {i === funnels.length - 1 && (
                      <LabelList dataKey="total" content={renderCustomLabel} />
                    )}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Vendas no mês corrente
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
        {funnelPerformance.map((funnel) => (
          <Box key={funnel.funnel} sx={{ flex: 1, minWidth: 0 }}>
            <Card sx={{ width: '100%', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom textAlign="center">
                  {funnel.funnel}
                </Typography>
                <Box sx={{ textAlign: 'center' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadialBarChart
                      innerRadius="40%"
                      outerRadius="100%"
                      data={[
                        { name: 'target', value: funnel.proratedPercentage, fill: `${funnel.fill}40` },
                        { name: 'actual', value: funnel.percentage, fill: funnel.fill }
                      ]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={10}
                        label={{
                          position: 'center',
                          fill: '#000',
                          fontSize: 24,
                          fontWeight: 'bold',
                          formatter: (value: any) => 
                            typeof value === 'number' ? `${funnel.percentage.toFixed(0)}%` : '0%'
                        }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <Typography variant="body1" fontWeight="bold">
                    {funnel.actual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    de {funnel.target.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Meta hoje: {funnel.proratedTarget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Funis de vendas
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, width: '100%', flexWrap: 'wrap' }}>
        {funnelPipelineData.map((funnelData) => (
          <Box key={funnelData.funnel} sx={{ flex: 1, minWidth: 300 }}>
            <Card sx={{ width: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {funnelData.funnel}
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Estágio</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Negociações</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {funnelData.pipeline.map((item: any, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px' }}>{item.stage}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>{item.count}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            {(item.valor_recorrente + item.valor_nao_recorrente).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </>
  );
}
