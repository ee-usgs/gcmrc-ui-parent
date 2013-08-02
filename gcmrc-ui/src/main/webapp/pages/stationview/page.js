CONFIG.everyPeriod = 'P1M';

GCMRC.Page = {
	createMiniMap : function(config) {
		if (!config) config = {};
		
		var stationName = config['stationName'] || '00000000';
		var divId = config['divId'] || 'openlayers-map';
		
		var options = {};
		GCMRC.Mapping.maps[divId] = new OpenLayers.Map(divId, options);
//		GCMRC.Mapping.maps[divId].addControl(new OpenLayers.Control.LayerSwitcher());
		
		var layersToAdd = [];
		layersToAdd.push(GCMRC.Mapping.layers.esri.esriTopo);
//		[].push.apply(layersToAdd, GCMRC.Mapping.layers.esri.values());
		layersToAdd.push(GCMRC.Mapping.layers.markers);
		
		GCMRC.Mapping.maps[divId].addLayers(layersToAdd);

		var siteLonLat = new OpenLayers.LonLat(GCMRC.Stations[stationName].lon, GCMRC.Stations[stationName].lat).transform(
			new OpenLayers.Projection("EPSG:4326"),
			GCMRC.Mapping.maps[divId].getProjectionObject()
			);

		var makeIcon = function() {
			var size = new OpenLayers.Size(21,25);
			var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
			var icon = new OpenLayers.Icon(CONFIG.relativePath + 'app/marker.png', size, offset);

			return icon;
		};

		GCMRC.Mapping.layers.markers.addMarker(new OpenLayers.Marker(siteLonLat, makeIcon()));

		GCMRC.Mapping.maps[divId].setCenter(siteLonLat, 14);
	},
	fromDateClicked : function() {
		$('#beginDatePicker').val($(this).html());
	},
	toDateClicked : function() {
		var date = $(this).html();
		if ("Now" === date) {
			date = new Date();

			var formatted = {
				d: date.getUTCDate(),
				m: date.getUTCMonth() + 1,
				yyyy: date.getUTCFullYear()
			};

			formatted.dd = (formatted.d < 10 ? '0' : '') + formatted.d;
			formatted.mm = (formatted.m < 10 ? '0' : '') + formatted.m;

			date = [formatted['yyyy'], formatted['mm'], formatted['dd']].join('-');
		}
		$('#endDatePicker').val(date);
	},
	addParamToList : function(el) {
		var allMethods = GCMRC.Page.params[el].keys().filter(function(n){return "description" !== n});
		
		var description = GCMRC.Page.params[el].description;
		var instParam = Object.reduce(GCMRC.Page.params[el], function(a, b) {
			var result = null;
			if (a && 'inst' === a.sampleMethod) {
				result = a;
			}
			if (b && 'inst' === b.sampleMethod) {
				result = b;
			}
			return result;
		}) || {};
		
		var pCode = el;
		var displayName = description["displayName"];
		var fromDate = description.earliestMethod.split("T")[0];
		var toDate = description.latestMethod.split("T")[0];
		var ppq = instParam["ppq"];
		var units = description["units"];
		var unitsShort = description["unitsShort"];

		var listing = ['<div class="parameterListing">',
			'<h5><input type="checkbox" name="',
			pCode,
			'">',
			displayName,
			'</h5>',
			'<ul>'];

		if (allMethods.some(function(e){return "inst" !== e})) {
			var ppqualifier = ppq || "Instantaneous";
			listing.push(
					'<ul>'
					);
			if (allMethods.some("inst")) {
				listing.push(
						'<li>',
						'<input type="radio" name="dataradio',
						el,
						'" value="',
						allMethods.join(","),
						'">' + ppqualifier + ' Data and Physical Samples',
						'</li>'
					);
			}
			listing.push(
					'<li>',
					'<input type="radio" name="dataradio',
					el,
					'" value="',
					allMethods.filter(function(e){return "inst" !== e}).join(","),
					'">Physical Samples Only',
					'</li></ul>'
				);
		}

		listing.push(
			'<li>',
			units,
			' (',
			unitsShort,
			')</li>',
			'<li><a href="#" class="date fromdate">',
			fromDate,
			'</a> to <a href="#" class="date todate">',
			toDate,
			'</a></li>',
			'</ul></div>');
		$('#parameterList').append(listing.join(''));
		$("input[name=dataradio" + el + "]").first().attr("checked", true);
	},
	addParameters : function() {
		GCMRC.Page.params.values().sortBy(function(n) {
			return parseFloat(n.values().sample().displayOrder);
		}).map(function(n) {
			return n.values().sample().pCode;
		}).forEach(GCMRC.Page.addParamToList);
		
		$('.fromdate').click(GCMRC.Page.fromDateClicked);
		$('.todate').click(GCMRC.Page.toDateClicked);
	},
	addCreditToList : function(e) {
		var org = GCMRC.Organizations[e];
		
		if (org) {
			var listing = [
				'<li><div><a href="',
				org.url,
				'"><img src="',
				org.logo.url,
				'" height="',
				org.logo.height,
				'px" width="',
				org.logo.width,
				'px">',
				org.displayName,
				'</a></div></li>'
			];

			$('#addlSourcesBody').append(listing.join(''));
		} else {
			LOG.info("Unknown Organizational Name, or no Additional Info associated with '" + e +"'");
		}
	},
	addCredits : function() {
		if (GCMRC.Page.credits.length > 0) {
			$('#addlSourcesBody').append('<b>Data provided by:</b>');
			GCMRC.Page.credits.forEach(GCMRC.Page.addCreditToList);
		} else {
			LOG.trace("No Credits for this station.");
		}
	},
	addPublicationToList : function(pub) {
		if (pub && pub.url && pub.displayName) {
			var listing = [
				'<li><a href="',
				pub.url,
				'">',
				pub.displayName,
				'</a></li>'
			];

			$('#addlPubsBody').append(listing.join(''));
		} else {
			LOG.error("No/Invalid Publication?");
		}
	},		
	addPubs: function() {
		if (GCMRC.Page.pubs.length > 0) {
			$('#addlPubsBody').append('<b>Key Publications:</b>');
			GCMRC.Page.pubs.forEach(GCMRC.Page.addPublicationToList);
		} else {
			LOG.trace("No Publications for this station.");
		}
	},
	checkIfAgg : function(config) {
		var result = null;

		var conf = config || {};
		var begin = new Date(conf['beginPosition']).getTime();
		var end = new Date(conf['endPosition']).getTime();
		var cols = conf['column'] || [];

		var month = 1/*month*/ * 31/*days*/ * 24/*hours*/ * 60/*minutes*/ * 60/*seconds*/ * 1000/*millis*/;
		var year = 12 * month;
		var maxDifference = 6 * month;
		var minDifference = 2 * month;
		var interval = 2 * month;

		var diff = maxDifference;
		var i = (cols.length) - 1;
		diff = diff - (interval * i);
		if (diff < minDifference) {
			diff = minDifference;
		}

		var realDifference = end - begin;
		if (realDifference > diff) {
			if (realDifference > year) {
				result = 'PT24H';
			} else if (realDifference > maxDifference) {
				result = 'PT12H';
			} else {
				result = 'PT6H';
			}
		}

		return result;
	},
	getExpectedGraphColumns : function() {
		var result = [];
		var chosenParameters = $('.parameterListing input:checkbox:checked');
		result = $.map(chosenParameters, function(el, i) {
			var result = [];
			var whatchaGotForMe = $('[name=dataradio' + el.name + ']:checked');
			var toGet = whatchaGotForMe.attr("value");
			
			var cols = [];
			if (toGet) { //Freakin Smelly
				var toGetSplit = toGet.split(",");
				[].push.apply(cols, toGetSplit.map(function(key) {
					var tsGroupName = GCMRC.Page.params[el.name][key].tsGroup;
					if (tsGroupName) {
						tsGroupName = "!" + tsGroupName;
					} else {
						tsGroupName = "";
					}
					return key + "!" + el.name + tsGroupName + "-" + CONFIG.stationName;
				}));
			} else {
				var tsGroupName = GCMRC.Page.params[el.name].inst.tsGroup;
				if (tsGroupName) {
					tsGroupName = "!" + tsGroupName;
				} else {
					tsGroupName = "";
				}
				cols.push("inst!" + el.name + tsGroupName + "-" + CONFIG.stationName);
			}
			result.push({
				pCode : el.name,
				columns : cols
			});
			return result;
		});
		return result;
	},
	hasData : function(params, reqBegin, reqEnd) {
		var result = false;
		
		if (params) {
			result = params.reduce(function(someDataPresent, el) {
				var thisDataPresent = false;
				if (!someDataPresent) {
					GCMRC.Page.params[el].values(function(param) {
						var elBegin = param.beginPosition;
						var elEnd = param.endPosition;

						if (new Date(reqBegin) <= new Date(elEnd) &&
							new Date(reqEnd) > new Date(elBegin)) {
							thisDataPresent = true;
						}
					});
				}
				return someDataPresent || thisDataPresent;
			}, false);
		}
		
		return result;
	},
	buildGraphClicked : function() {
		var begin = $("input[name='beginPosition']").val();
		var end = $("input[name='endPosition']").val();
		
		var beginMillis = Date.create(begin).getUTCTime() + (CONFIG.networkHoursOffset * 60 * 60 * 1000);
		var endMillis = Date.create(end).getUTCTime() + (CONFIG.networkHoursOffset * 60 * 60 * 1000);
		if (endMillis >= beginMillis) {
			var expectedGraphColumns = GCMRC.Page.getExpectedGraphColumns();
			if (GCMRC.Page.hasData(expectedGraphColumns.map(function(el) {return el.pCode;}), begin, end)) {
				var chosenParameters = [];
				expectedGraphColumns.forEach(function(el) {
					[].push.apply(this, el.columns.map(function(col) {
						return col.split("-")[0];
					}));
				}, chosenParameters);

				var serviceOptions = {
					station: [CONFIG.stationName],
					beginPosition: begin,
					endPosition: end,
					column: chosenParameters,
					tz: '-' + CONFIG.networkHoursOffset,
					timeFormat: 'UTCMillis',
					every: CONFIG.everyPeriod,
					noDataFilter: 'true',
					useLagged: 'true'
				};

				var aggTime = GCMRC.Page.checkIfAgg(serviceOptions);

				if (aggTime) {
					serviceOptions['downscale'] = aggTime;
				}

				GCMRC.Graphing.createDataGraph(
						'agg',
						{
							divId: 'data-dygraph',
							labelDivId: 'legend-dygraph',
							graphsToMake : expectedGraphColumns,
							dateWindow : [beginMillis, endMillis]
						},
				serviceOptions);
			} else {
				if (0 < expectedGraphColumns.length) {
					GCMRC.Graphing.clearErrorMsg();
					GCMRC.Graphing.showErrorMsg("Please choose a date range that overlaps the selected period of records.<br>Start Date is inclusive, End Date is exclusive.");
				} else {
					GCMRC.Graphing.clearErrorMsg();
					GCMRC.Graphing.showErrorMsg("Please select a parameter to graph!");
				}
			}
		} else {
			GCMRC.Graphing.clearErrorMsg();
			GCMRC.Graphing.showErrorMsg("Please choose an End that is after Start");
		}
	},
	createDateList: function(container, dates) {
		var result = [];

		if (dates && dates.endStaticRec && dates.newestSuspSed) {
			var endStatic = dates.endStaticRec;
			var newest = dates.newestSuspSed;
			var endStaticSplit = dates.endStaticRec.split('T');
			var newestSplit = dates.newestSuspSed.split('T');
			if (1 < endStaticSplit.length && 1 < newestSplit.length) {
				endStatic = endStaticSplit[0];
				newest = newestSplit[0];
			}

			var majorTribName = "Major Tributary";
			if (GCMRC.Page.reach.majorTribRiver) {
				majorTribName = GCMRC.Page.reach.majorTribRiver;
			}

			[].push.apply(result, [
				'<div class="innerRightSidebar">',
				'<div class="sectionTitle">Data Status</div>',
				'<div><ul>',
				'<li>',
				"End of complete lab-processed suspended-sediment record for " + majorTribName + ": ",
				'<a href="#" class="todate">',
				endStatic,
				'</a>',
				'</li>',
				'<li>',
				"Most recent suspended-sediment sample from " + majorTribName + " used in calculations: ",
				'<a href="#" class="todate">',
				newest,
				'</a>',
				'</li>',
				'</ul></div>',
				'</div>']);
		}

		container.append(result.join(""));
	},
	downloadPopupClicked : function() {
		var begin = $("input[name='beginPosition']").val();
		var end = $("input[name='endPosition']").val();
		
		var beginMillis = Date.create(begin).getTime();
		var endMillis = Date.create(end).getTime();
		if (endMillis >= beginMillis) {
			var expectedGraphColumns = GCMRC.Page.getExpectedGraphColumns();
			var expectedDownloadColumns = expectedGraphColumns.filter(function(el) {
				var result = el.columns.some(function(n) {
					return n.startsWith("inst!") && "Sample-adjusted Modeled" !== GCMRC.Page.params[this.pCode].inst.ppq;
				}, el);
				return result;
			});
			if (GCMRC.Page.hasData(expectedDownloadColumns.map(function(el) {return el.pCode;}), begin, end)) {
				var columnOrdering = [];
				columnOrdering.push({pCode:"time", name:"Time", format:"yyyy-MM-dd HH:mm:ss", timeZoneInHeader:true});
				expectedDownloadColumns.forEach(function(el) {
					columnOrdering.push({pCode : el.pCode, name : GCMRC.Page.params[el.pCode].inst.displayName, reorderable : true});
				});
				
				GCMRC.Page.colOrder.remove(function(n){return true;});
				columnOrdering.forEach(function(el) {
					GCMRC.Page.colOrder.push(el);
				});
				angular.element($('#downloadColumnOrdering')).scope().$apply()
				
				$('#downloadPopup').modal();
			} else {
				GCMRC.Graphing.clearErrorMsg();
				GCMRC.Graphing.showErrorMsg("No data selected!");
			}
		} else {
			GCMRC.Graphing.clearErrorMsg();
			GCMRC.Graphing.showErrorMsg("Please choose an End that is after Start");
		}
	},
	downloadDataClicked : function() {
		var begin = $("input[name='beginPosition']").val();
		var end = $("input[name='endPosition']").val();
		
		//Make absolutely sure they're formatted correctly for the services.
		var beginClean = Date.create(begin).format('{yyyy}-{MM}-{dd}');
		var endClean = Date.create(end).format('{yyyy}-{MM}-{dd}');
		
		var expectedGraphColumns = GCMRC.Page.getExpectedGraphColumns();
		var chosenParameters = [];
		GCMRC.Page.colOrder.forEach(function(el) {
			var resource = this.expected.find(function(n){
				return n.pCode === el.pCode;
			});
			
			var columnDef = null;
			if (resource) {
				columnDef = resource.columns.filter(function(col) {
					return col.startsWith('inst!');
				}).map(function(col) {
					return col.split("-")[0];
				});
			}
			
			if (columnDef) {
				[].push.apply(this.chosen, columnDef);
			}
			
		}, {expected: expectedGraphColumns, chosen: chosenParameters});
		
		var timeColumn = GCMRC.Page.colOrder.find(function(n){return "time" === n.pCode;});
		var timeFormat = timeColumn.format;
		var timeZoneInHeader = timeColumn.timeZoneInHeader;
		
		var serviceOptions = {
			station: [CONFIG.stationName],
			beginPosition: beginClean,
			endPosition: endClean,
			column: chosenParameters,
			tz: '-' + CONFIG.networkHoursOffset,
			timeFormat: timeFormat,
			tzInHeader: timeZoneInHeader,
			output: 'tab',
			download: 'on'
		};

		document.location = document.location.href.first(document.location.href.lastIndexOf('/') + 1) + CONFIG.relativePath + 'services/agg?' + $.param(serviceOptions);
	},
	colOrder: [],
	earliestPosition : null,
	latestPosition : null,
	params : {},
	paramsLoad : JSL.ResourceLoad(function(el) {
		if (!GCMRC.Page.params[el.pCode]) {
			GCMRC.Page.params[el.pCode] = {
				description : {
					pCode : el.pCode,
					displayName : el.displayName,
					displayOrder : el.displayOrder,
					units : el.units,
					unitsShort : el.unitsShort,
					earliestMethod : el.beginPosition,
					latestMethod : el.endPosition
				}
			};
		}
		el.sampleMethod = 'inst';
		el.color = "#006666";
		el.highlightColor = "#FF0033";
		GCMRC.Page.params[el.pCode][el.sampleMethod] = el;
		
		var thisBeginPosition = new Date(el.beginPosition).getTime();
		if (!GCMRC.Page.earliestPosition || thisBeginPosition < GCMRC.Page.earliestPosition) {
			GCMRC.Page.earliestPosition = thisBeginPosition;
		}
		if (thisBeginPosition < GCMRC.Page.params[el.pCode].description.earliestMethod) {
			GCMRC.Page.params[el.pCode].description.earliestMethod = thisBeginPosition;
		}
		
		var thisEndPosition = new Date(el.endPosition).getTime();
		if (!GCMRC.Page.latestPosition || thisEndPosition > GCMRC.Page.latestPosition) {
			GCMRC.Page.latestPosition = thisEndPosition;
		}
		if (thisEndPosition > GCMRC.Page.params[el.pCode].description.latestMethod) {
			GCMRC.Page.params[el.pCode].description.latestMethod = thisEndPosition;
		}
	}),
	qwLoad : JSL.ResourceLoad(function(el) {
		if (!GCMRC.Page.params[el.pCode]) {
			GCMRC.Page.params[el.pCode] = {
				description : {
					pCode : el.pCode,
					displayName : el.pCodeName,
					displayOrder : el.displayOrder,
					units : el.units,
					unitsShort : el.unitsShort,
					earliestMethod : el.beginPosition,
					latestMethod : el.endPosition
				}
			};
		}
		
		if ("EDI" === el.sampleMethod || "EWI" === el.sampleMethod || "s vert" === el.sampleMethod || "m vert" === el.sampleMethod) {
			el.color = "#CC9966";
			el.highlightColor = "#FF9900";
		} else {
			el.color = "#333399";
			el.highlightColor = "#990099";
		}
		
		el.series = {
			strokeWidth: 0.0,
			drawPoints: true,
			pointSize: 3,
			highlightCircleSize: 4,
			plotter: GCMRC.Dygraphs.DotPlotter
		};
		
		GCMRC.Page.params[el.pCode][el.sampleMethod] = el;
		
		var thisBeginPosition = new Date(el.beginPosition).getTime();
		if (!GCMRC.Page.earliestPosition || thisBeginPosition < GCMRC.Page.earliestPosition) {
			GCMRC.Page.earliestPosition = thisBeginPosition;
		}
		if (thisBeginPosition < GCMRC.Page.params[el.pCode].description.earliestMethod) {
			GCMRC.Page.params[el.pCode].description.earliestMethod = thisBeginPosition;
		}
		
		var thisEndPosition = new Date(el.endPosition).getTime();
		if (!GCMRC.Page.latestPosition || thisEndPosition > GCMRC.Page.latestPosition) {
			GCMRC.Page.latestPosition = thisEndPosition;
		}
		if (thisEndPosition > GCMRC.Page.params[el.pCode].description.latestMethod) {
			GCMRC.Page.params[el.pCode].description.latestMethod = thisEndPosition;
		}
	}),
	credits : [],
	creditLoad : JSL.ResourceLoad(function(el) {
		GCMRC.Page.credits.push(el.orgCode);
	}),
	pubs : [],
	pubsLoad : JSL.ResourceLoad(function(el) {
		GCMRC.Page.pubs.push(el);
	}),
	reach: {},
	reachLoad: JSL.ResourceLoad(function(el) {
		GCMRC.Page.reach = el;
	})
};

gcmrcModule.controller('downloadPopupController', function($scope) {
	$scope.columnOrdering = GCMRC.Page.colOrder;
	$scope.columnSelected = null;
	$scope.liClicked = function() {
		$scope.columnSelected = this.el;
	};
	$scope.isSelected = function() {
		var result = false;
		if (Object.reject(this.el, /\$/).equals(Object.reject($scope.columnSelected, /\$/))) {
			result = true;
		}
		return result;
	};
});

gcmrcModule.directive('helpTooltip', function() {
	return {
		link: function(scope, element, attrs, ngModel) {
			element.tooltip({
				trigger : "focus",
				html : true,
				title : "<table>"+
						"	<thead>"+
						"		<th>Symbol</th>"+
						"		<th>Meaning</th>"+
						"		<th>Example</th>"+
						"	</thead>"+
						"	<tbody>"+
						"		<tr>"+
						"			<td>y</td><td>year</td><td>1996</td>"+
						"		</tr>"+
						"		<tr>"+
						"			<td>D</td><td>day of year</td><td>189</td>"+
						"		</tr>"+
						"		<tr>"+
						"			<td>d</td><td>day of month</td><td>10</td>"+
						"		</tr>"+
						"		<tr>"+
						"			<td>a</td><td>halfday of day</td><td>PM</td>"+
						"		</tr>"+
						"		<tr>"+
						"			<td>h</td><td>clockhour of halfday (1~12)</td><td>12</td>"+
						"		</tr>"+
						"		<tr>"+
						"			<td>H</td><td>hour of day (0~23)</td><td>0</td>"+
						"		</tr>"+
						"		<tr>"+
						"			<td>m</td><td>minute of hour</td><td>30</td>"+
						"		</tr>"+
						"		<tr>"+
						"			<td>s</td><td>second of minute</td><td>55</td>"+
						"		</tr>"+
						"		<tr>"+
						"			<td>Z</td><td>time zone offset/id</td><td>-0800; -08:00; America/Los_Angeles</td>"+
						"		</tr>"+
						"		<tr>"+
						"			<td>'</td><td>escape for text</td><td></td>"+
						"		</tr>"+
						"	</tbody>"+
						"</table>",
				placement : 'bottom'
			});
		}
	}
});