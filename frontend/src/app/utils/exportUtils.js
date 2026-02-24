/**
 * Converts an array of objects to a CSV string and triggers a download.
 * @param {Array<Object>} data - The data to export.
 * @param {string} fileName - The name of the file to save (without extension).
 * @param {Array<string>} [headers] - Optional explicit headers to include.
 */
export const exportToCSV = (data, fileName = "export", headers = null) => {
    if (!data || !data.length) {
        console.error("No data available for export");
        return;
    }

    // Determine headers from first object if not provided
    const columnHeaders = headers || Object.keys(data[0]);

    // Create CSV rows
    const csvContent = [
        columnHeaders.join(","), // Header row
        ...data.map(row =>
            columnHeaders.map(header => {
                let cellData = row[header] === null || row[header] === undefined ? "" : row[header];
                // Escape quotes and wrap in quotes if contains comma
                cellData = cellData.toString().replace(/"/g, '""');
                return cellData.includes(",") ? `"${cellData}"` : cellData;
            }).join(",")
        )
    ].join("\n");

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${fileName}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
