import { Dimensions, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useColors } from "@/contexts/theme-context";
import { borderRadius, spacing } from "@/theme";

interface ChartDataPoint {
  value: number;
  date: Date;
}

interface Props {
  data: ChartDataPoint[];
  weightUnit: string;
}

const screenWidth = Dimensions.get("window").width;

export default function WeightChart({ data, weightUnit }: Props) {
  const colors = useColors();

  return (
    <LineChart
      data={{
        labels: data
          .filter((_, i) => {
            const step = Math.max(1, Math.floor(data.length / 5));
            return i % step === 0 || i === data.length - 1;
          })
          .map((d) =>
            d.date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          ),
        datasets: [{ data: data.map((d) => d.value) }],
      }}
      width={screenWidth - spacing.md * 2}
      height={200}
      yAxisSuffix={` ${weightUnit}`}
      chartConfig={{
        backgroundColor: colors.surface,
        backgroundGradientFrom: colors.surface,
        backgroundGradientTo: colors.surface,
        decimalPlaces: 1,
        color: () => colors.primary,
        labelColor: () => colors.textSecondary,
        propsForDots: { r: "4", fill: colors.primary },
      }}
      bezier
      style={styles.chart}
    />
  );
}

const styles = StyleSheet.create({
  chart: { borderRadius: borderRadius.md, alignSelf: "center" },
});
