interface ChartDataPoint {
  value: number;
  date: Date;
}

interface Props {
  data: ChartDataPoint[];
  weightUnit: string;
}

export default function WeightChart(_props: Props) {
  return null;
}
