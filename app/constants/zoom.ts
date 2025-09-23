export const modes = [
    {id: 'day', name: 'Day', basePixels: 24, minPixels: 13.856},
    {id: 'quarter', name: 'Week', basePixels: 8, minPixels: 5.657, maxPixels: 13.856},
    {id: 'half', name: 'Month', basePixels: 4, minPixels: 2.828, maxPixels: 5.657},
    {id: 'year', name: 'Year', basePixels: 2, minPixels: 1.414, maxPixels: 2.828},
    {id: 'two_year', name: 'Two Years', basePixels: 1, maxPixels: 1.414}
];

export const getMode = (pixels: number) => {
    for (let i = 0; i < modes.length; i++) {
        const mode = modes[i];
        if (mode.minPixels === undefined) return i;
        if (pixels >= mode.minPixels) return i;
    }
    return 0;
};

export const zoomIndeces: { [key: string]: number } = {
    day: 0,
    quarter: 1,
    half: 2,
    year: 3,
    two_year: 4
};

export const zoomMonths: { [key: string]: number } = {
    day: 1,
    quarter: 3,
    half: 6,
    year: 12,
    two_year: 24
};

export const dateAndZoomToLowestDate = (date: string, zoom: string) => {
    const earliestDate = new Date(date);
    earliestDate.setDate(1);
    earliestDate.setMonth(earliestDate.getMonth() - zoomMonths[zoom]);
    return earliestDate.toISOString().split('T')[0]
};

export default {
    modes,
    getMode,
    zoomIndeces,
    zoomMonths,
    dateAndZoomToLowestDate
};