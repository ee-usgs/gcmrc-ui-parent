package gov.usgs.cida.gcmrcservices.mb.model;

/**
 *
 * @author zmoore
 */
public class DurationCurvePoint {
	
	private int binNumber;
	private Double cumulativeBinPerc;
	private Double binValue;
	private Double inBinMinutes;
	private Double cumulativeInBinMinutes;
	private Double lowBound;
	private Double highBound;

	public DurationCurvePoint() {
	}

	public DurationCurvePoint(int binNumber, Double cumulativeBinPerc, Double binValue, Double inBinMinutes, Double cumulativeInBinMinutes, Double lowBound, Double highBound) {
		this.binNumber = binNumber;
		this.cumulativeBinPerc = cumulativeBinPerc;
		this.binValue = binValue;
		this.inBinMinutes = inBinMinutes;
		this.cumulativeInBinMinutes = cumulativeInBinMinutes;
		this.lowBound = lowBound;
		this.highBound = highBound;
	}

	public int getBinNumber() {
		return binNumber;
	}
	
	public Double getCumulativeBinPerc() {
		return cumulativeBinPerc;
	}
	
	public Double getBinValue() {
		return binValue;
	}
	
	public Double getInBinMinutes() {
		return inBinMinutes;
	}
	
	public Double getCumulativeInBinMinutes() {
		return cumulativeInBinMinutes;
	}
	
	public Double getLowBound() {
		return lowBound;
	}
	
	public Double getHighBound() {
		return highBound;
	}
}
