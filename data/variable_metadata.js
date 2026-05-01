/* Variable metadata — single source of truth for labels, units, palette,
   and source attribution across the Chile Historical GIS Platform.

   Schema:
     code: {
       label:       string  // human-readable variable name (figure title)
       short:       string  // optional short label for legends
       source:      string  // citation shown in the figure source line
       unit:        string  // units suffix shown on axis / legend
       format:      "count" | "currency" | "percent" | "rate_per_1000"
                  | "rate_per_100k" | "binary"
       palette:     "sequential" | "diverging" | "highlight"
       midpoint?:   number   // center of diverging scale (default 0)
       geo_levels:  string[] // ["department"] | ["province"] | ["national"]
       accent?:     string   // single-series stroke color (time series)
     }
*/

window._variableMetadata = {
    /* ===== DEPARTMENT-LEVEL ===== */

    /* Occupations — Census 1865-1920 (counts, sequential) */
    peasant: {
        label: "Agricultural workers",
        short: "Peasants",
        source: "Chilean Census, 1865–1920",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },
    pubemp: {
        label: "Public employees",
        source: "Chilean Census, 1865–1920",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },
    military: {
        label: "Military personnel",
        source: "Chilean Census, 1865–1920",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },
    lawyer: {
        label: "Lawyers",
        source: "Chilean Census, 1865–1920",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },
    engineers: {
        label: "Engineers",
        source: "Chilean Census, 1865–1920",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },
    teacher: {
        label: "Teachers",
        source: "Chilean Census, 1865–1920",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },

    /* Education */

    /* Land structure */

    /* Fiscal — department level */

    /* State presence */

    /* Church / civil registry */

    /* ===== PROVINCE-LEVEL ===== */

    poblacion_urbana: {
        label: "Urban population",
        source: "Chilean Census, 1875–1970",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },
    poblacion_rural: {
        label: "Rural population",
        source: "Chilean Census, 1875–1970",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },
    pct_poblacion_urbana: {
        label: "Urbanization rate",
        source: "Chilean Census, 1875–1970",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["province"]
    },

    /* ===== NATIONAL TIME SERIES ===== */
    /* Keyed by the full label string used in national_timeseries.js */

    "Total Population": {
        label: "Total population", source: "Díaz, Lüders & Wagner (2016)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Total Labor Force": {
        label: "Total labor force", source: "Díaz, Lüders & Wagner (2016)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Labor Participation Rate": {
        label: "Labor force participation rate", source: "Díaz, Lüders & Wagner (2016)",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Agricultural Workers": {
        label: "Agricultural workers", source: "Díaz, Lüders & Wagner (2016)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },
    "Mining Workers": {
        label: "Mining workers", source: "Díaz, Lüders & Wagner (2016)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#8a5a00"
    },
    "Manufacturing Workers": {
        label: "Manufacturing workers", source: "Díaz, Lüders & Wagner (2016)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#5a3b8a"
    },
    "Service Workers": {
        label: "Service workers", source: "Díaz, Lüders & Wagner (2016)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },
    "Construction Workers": {
        label: "Construction workers", source: "Díaz, Lüders & Wagner (2016)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#5a3b8a"
    },
    "Exports (millions 1995 pesos)": {
        label: "Exports", source: "Díaz, Lüders & Wagner (2016)",
        unit: "millions of 1995 pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Imports (millions 1995 pesos)": {
        label: "Imports", source: "Díaz, Lüders & Wagner (2016)",
        unit: "millions of 1995 pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },
    "Exports (% of GDP)": {
        label: "Exports", source: "Díaz, Lüders & Wagner (2016)",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Imports (% of GDP)": {
        label: "Imports", source: "Díaz, Lüders & Wagner (2016)",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },
    "Trade Openness (% of GDP)": {
        label: "Trade openness", source: "Díaz, Lüders & Wagner (2016)",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Fiscal Revenue (millions)": {
        label: "Fiscal revenue", source: "Díaz, Lüders & Wagner (2016)",
        unit: "millions of 1995 pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Fiscal Expenditure (millions)": {
        label: "Fiscal expenditure", source: "Díaz, Lüders & Wagner (2016)",
        unit: "millions of 1995 pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },
    "Revenue (% of GDP)": {
        label: "Fiscal revenue", source: "Díaz, Lüders & Wagner (2016)",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Expenditure (% of GDP)": {
        label: "Fiscal expenditure", source: "Díaz, Lüders & Wagner (2016)",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },
    "Fiscal Surplus (% of GDP)": {
        label: "Fiscal balance",
        source: "Díaz, Lüders & Wagner (2016)",
        unit: "% of GDP", format: "percent", palette: "diverging",
        midpoint: 0, geo_levels: ["national"], accent: "#1f4e79"
    },

    "Real GDP": {
        label: "Real GDP",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of 1995 pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Real GDP per capita": {
        label: "Real GDP per capita",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "1995 pesos / person", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Real GDP per worker": {
        label: "Real GDP per worker",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "1995 pesos / worker", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Real GDP growth rate": {
        label: "Real GDP growth rate",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "diverging",
        midpoint: 0,
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Real GDP per capita growth rate": {
        label: "Real GDP per capita growth rate",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "diverging",
        midpoint: 0,
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Agriculture share of GDP": {
        label: "Agriculture share of GDP",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },

    "Mining share of GDP": {
        label: "Mining share of GDP",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#8a5a00"
    },

    "Manufacturing share of GDP": {
        label: "Manufacturing share of GDP",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#5a3b8a"
    },

    "Construction share of GDP": {
        label: "Construction share of GDP",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#666666"
    },

    "Services share of GDP": {
        label: "Services share of GDP",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "External debt share of GDP": {
        label: "External debt share of GDP",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Direct taxes share of revenue": {
        label: "Direct taxes share of revenue",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Indirect taxes share of revenue": {
        label: "Indirect taxes share of revenue",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Education share of expenditure": {
        label: "Education share of expenditure",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },

    "Wheat production": {
        label: "Wheat production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "metric quintals", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#a16702"
    },

    "Maize production": {
        label: "Maize production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "metric quintals", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#a16702"
    },

    "Barley production": {
        label: "Barley production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "metric quintals", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#a16702"
    },

    "Potato production": {
        label: "Potato production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "metric quintals", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#a16702"
    },

    "Bean production": {
        label: "Bean production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "metric quintals", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#a16702"
    },

    "Gold production": {
        label: "Gold production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "grams", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#8a5a00"
    },

    "Silver production": {
        label: "Silver production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "kilograms", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#8a5a00"
    },

    "Copper production": {
        label: "Copper production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "metric tons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#8a5a00"
    },

    "Coal production": {
        label: "Coal production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "metric tons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#8a5a00"
    },

    "Saltpeter production": {
        label: "Saltpeter production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "kilograms", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#8a5a00"
    },

    "Crude birth rate": {
        label: "Crude birth rate",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "per 1,000", format: "rate_per_1000", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },

    "Crude death rate": {
        label: "Crude death rate",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "per 1,000", format: "rate_per_1000", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Infant mortality rate": {
        label: "Infant mortality rate",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "per 1,000 live births", format: "rate_per_1000", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Natural population growth rate": {
        label: "Natural population growth rate",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "per 1,000", format: "rate_per_1000", palette: "diverging",
        midpoint: 0,
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Net migration rate": {
        label: "Net migration rate",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "per 1,000", format: "rate_per_1000", palette: "diverging",
        midpoint: 0,
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "State-owned railway length": {
        label: "State-owned railway length",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "km", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Primary school enrollment": {
        label: "Primary school enrollment",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "students", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },

    "Secondary school enrollment": {
        label: "Secondary school enrollment",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "students", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },

    "Higher education enrollment": {
        label: "Higher education enrollment",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "students", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },

    "External public debt": {
        label: "External public debt",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Internal public debt": {
        label: "Internal public debt",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Railway network length": {
        label: "Railway network length",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "km", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#666666"
    },

    "Private railway length": {
        label: "Private railway length",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "km", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#666666"
    },

    "Telephones in service": {
        label: "Telephones in service",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "lines", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#666666"
    },

    "Peso exchange rate": {
        label: "Peso exchange rate",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "pence per peso", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Manufacturing production index": {
        label: "Manufacturing production index",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "index", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#5a3b8a"
    },

    "Electricity production": {
        label: "Electricity production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "GWh", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#5a3b8a"
    },

    "Port traffic": {
        label: "Port traffic",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "metric tons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Agricultural GDP": {
        label: "Agricultural GDP",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of 1995 pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },

    "Mining GDP": {
        label: "Mining GDP",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of 1995 pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#8a5a00"
    },

    "Manufacturing GDP": {
        label: "Manufacturing GDP",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of 1995 pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#5a3b8a"
    },

    "Construction GDP": {
        label: "Construction GDP",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of 1995 pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#666666"
    },

    "Services GDP": {
        label: "Services GDP",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of 1995 pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Exports in current dollars": {
        label: "Exports in current dollars",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of USD", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Imports in current dollars": {
        label: "Imports in current dollars",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of USD", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Mining exports": {
        label: "Mining exports",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of USD", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#8a5a00"
    },

    "Agricultural exports": {
        label: "Agricultural exports",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of USD", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },

    "Manufacturing exports": {
        label: "Manufacturing exports",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of USD", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#5a3b8a"
    },

    "Consumer goods imports": {
        label: "Consumer goods imports",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of USD", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Capital goods imports": {
        label: "Capital goods imports",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of USD", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Intermediate goods imports": {
        label: "Intermediate goods imports",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of USD", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Import capacity": {
        label: "Import capacity",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    total_population: {
        label: "Total population",
        source: "Sinopsis Estadística 1924-1927, Cuadro II.2 (Población de las provincias y departamentos desde 1865 hasta 1920)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    nacimientos: {
        label: "Live births",
        source: "Anuario Estad\u00edstico 1935 and Sinopsis Estad\u00edstica 1924-1927",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    defunciones: {
        label: "Deaths",
        source: "Anuario Estad\u00edstico 1935 and Sinopsis Estad\u00edstica 1924-1927",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    matrimonios: {
        label: "Marriages",
        source: "Anuario Estad\u00edstico 1935 and Sinopsis Estad\u00edstica 1924-1927",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    literacy_rate: {
        label: "Literacy rate (% who can read)",
        source: "Chilean Census 1865-1952; literacy from census; schools from Anuarios 1875/1900/1907",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["department"]
    },

    literates_total: {
        label: "People who can read",
        source: "Chilean Census 1865-1952; literacy from census; schools from Anuarios 1875/1900/1907",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },

    total_population: {
        label: "Total population",
        source: "Chilean Census 1865-1952; literacy from census; schools from Anuarios 1875/1900/1907",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },

    pres_has_reg_civil: {
        label: "Civil registry office present",
        source: "Presupuesto de la Nación and Anuarios Estadísticos (1865-1935)",
        unit: "Yes / No", format: "binary", palette: "highlight",
        geo_levels: ["department"]
    },

    police: {
        label: "Police officers",
        source: "Chilean Census 1895/1907/1920",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },

    "Defense spending share of GDP": {
        label: "Defense spending share of GDP",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Defense share of expenditure": {
        label: "Defense share of expenditure",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Health share of expenditure": {
        label: "Health share of expenditure",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },

    "External taxes share of revenue": {
        label: "External taxes share of revenue",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Internal taxes share of revenue": {
        label: "Internal taxes share of revenue",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Mining taxes share of revenue": {
        label: "Mining taxes share of revenue",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#8a5a00"
    },

    "Other taxes share of revenue": {
        label: "Other taxes share of revenue",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#666666"
    },

    "Fiscal surplus (real pesos)": {
        label: "Fiscal surplus (real pesos)",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "millions of 1995 pesos", format: "currency", palette: "diverging",
        midpoint: 0,
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Male labor force": {
        label: "Male labor force",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Female labor force": {
        label: "Female labor force",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Unemployed labor force": {
        label: "Unemployed labor force",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#666666"
    },

    "Male labor force participation rate": {
        label: "Male labor force participation rate",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Female labor force participation rate": {
        label: "Female labor force participation rate",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Exports per capita (current dollars)": {
        label: "Exports per capita (current dollars)",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "USD", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Imports per capita (current dollars)": {
        label: "Imports per capita (current dollars)",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "USD", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },

    "Mining exports share": {
        label: "Mining exports share",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#8a5a00"
    },

    "Agricultural exports share": {
        label: "Agricultural exports share",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },

    "Manufacturing exports share": {
        label: "Manufacturing exports share",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#5a3b8a"
    },

    "Total population growth rate": {
        label: "Total population growth rate",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "per 1,000", format: "rate_per_1000", palette: "diverging",
        midpoint: 0,
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Primary enrollment share": {
        label: "Primary enrollment share",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },

    "Secondary enrollment share": {
        label: "Secondary enrollment share",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },

    "Total school enrollment": {
        label: "Total school enrollment",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "students", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },

    "Pea production": {
        label: "Pea production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "metric quintals", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#a16702"
    },

    "Chickpea production": {
        label: "Chickpea production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "metric quintals", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#a16702"
    },

    "Wine production": {
        label: "Wine production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "litres", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#7c2d3a"
    },

    "Sulfur production": {
        label: "Sulfur production",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "metric tons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#8a5a00"
    },

    "Natural gas consumption": {
        label: "Natural gas consumption",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "m\u00b3", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#5a3b8a"
    },

    "Air passenger movement": {
        label: "Air passenger movement",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "passengers", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },

    "Cattle output": {
        label: "Cattle output",
        source: "D\u00edaz, L\u00fcders & Wagner (2016) and INE Chile historical statistics",
        unit: "metric tons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#a16702"
    },

    ruralpop: {
        label: "Rural population",
        source: "Chilean Census 1865-1920",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },

    enfranchised: {
        label: "Enfranchised voters",
        source: "Memorias del Interior 1862-1920 (electoral registries)",
        unit: "voters", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },

    totexp: {
        label: "Provincial total expenditure",
        source: "Memorias de Hacienda 1856-1890",
        unit: "pesos", format: "currency", palette: "sequential",
        geo_levels: ["province"]
    },

    pubemp: {
        label: "Public employees (province)",
        source: "Chilean census + Memorias / Anuarios / INE",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    pubemp_per_capita: {
        label: "Public employees per capita",
        source: "Chilean census + Memorias / Anuarios / INE",
        unit: "per person", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    densidad_hab_por_km2: {
        label: "Population density",
        source: "Chilean census + Memorias / Anuarios / INE",
        unit: "per km\u00b2", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    superficie_km2: {
        label: "Province area",
        source: "Chilean census + Memorias / Anuarios / INE",
        unit: "km\u00b2", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    pct_pgb_provincial: {
        label: "Provincial GDP share",
        source: "Chilean census + Memorias / Anuarios / INE",
        unit: "% of national GDP", format: "percent", palette: "sequential",
        geo_levels: ["province"]
    },

    matrimonios_total: {
        label: "Marriages (modern era)",
        source: "Chilean census + Memorias / Anuarios / INE",
        unit: "events", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    tasa_matrimonios_por_mil: {
        label: "Marriage rate (modern era)",
        source: "Chilean census + Memorias / Anuarios / INE",
        unit: "per 1,000", format: "rate_per_1000", palette: "sequential",
        geo_levels: ["province"]
    },

    poblacion_extended: {
        label: "Population (extended panel)",
        source: "Chilean census + Memorias / Anuarios / INE",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    enfranchised_peasant: {
        label: "Enfranchised peasants",
        source: "Chilean Census + Memorias del Interior + Electoral records",
        unit: "voters", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },

    enfranchised_totalpop: {
        label: "Enfranchised population total",
        source: "Chilean Census + Memorias del Interior + Electoral records",
        unit: "voters", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },

    n_legislators: {
        label: "Active legislators",
        source: "Biblioteca del Congreso Nacional (BCN), 1831-1900",
        unit: "legislators", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },

    n_hacendados_legs: {
        label: "Legislators who were hacendados",
        source: "BCN biographical data, 1831-1900",
        unit: "legislators", format: "count", palette: "sequential",
        geo_levels: ["department"]
    },

    alumnos_total: {
        label: "Students enrolled (total)",
        source: "Anuario Estadístico 1860 (1849-1862 retrospective tables)",
        unit: "students", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    alumnos_h: {
        label: "Male students",
        source: "Anuario Estadístico 1860 (1849-1862 retrospective tables)",
        unit: "students", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    alumnos_m: {
        label: "Female students",
        source: "Anuario Estadístico 1860 (1849-1862 retrospective tables)",
        unit: "students", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    escuelas_total: {
        label: "Schools (total)",
        source: "Anuario Estadístico 1860 (1849-1862 retrospective tables)",
        unit: "schools", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    escuelas_h: {
        label: "Boys' schools",
        source: "Anuario Estadístico 1860 (1849-1862 retrospective tables)",
        unit: "schools", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    escuelas_m: {
        label: "Girls' schools",
        source: "Anuario Estadístico 1860 (1849-1862 retrospective tables)",
        unit: "schools", format: "count", palette: "sequential",
        geo_levels: ["province"]
    },

    pres_has_juez: {
        label: "Departmental judge present",
        source: "Memorias del Interior + Justicia (1865-1908)",
        unit: "Yes / No", format: "binary", palette: "highlight",
        geo_levels: ["department"]
    },

    pres_has_gobernador: {
        label: "Departmental governor present",
        source: "Memorias del Interior + Justicia (1865-1908)",
        unit: "Yes / No", format: "binary", palette: "highlight",
        geo_levels: ["department"]
    }
};

/* ===== Palette tracks =====
   Sequential = ColorBrewer YlGnBu-style 6-bin (perceptually monotonic).
   Diverging  = RdBu, anchored at midpoint.
   Highlight  = single accent + neutral gray.
   Colorblind = Okabe-Ito categorical / viridis sequential.
*/

window._palettes = {
    sequential: {
        default:    ["#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8"],
        colorblind: ["#fde725","#7ad151","#22a884","#2a788e","#414487","#440154"]  // viridis 6
    },
    diverging: {
        default:    ["#b2182b","#ef8a62","#fddbc7","#f7f7f7","#d1e5f0","#67a9cf","#2166ac"],
        colorblind: ["#b2182b","#ef8a62","#fddbc7","#f7f7f7","#d1e5f0","#67a9cf","#2166ac"]
    },
    highlight: {
        accent:     "#8b0000",
        neutral:    "#cccccc",
        accent_cb:  "#0072B2",  // Okabe-Ito blue
        neutral_cb: "#cccccc"
    },
    no_data:   "#e8e6e0",
    zero:      "#bdbdbd"
};

/* Tick formatters by `format` field. */
window._tickFormat = function(format, val) {
    if (val === null || val === undefined || isNaN(val)) return "";
    var n = Number(val);
    switch (format) {
        case "percent":
            return (Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(1)) + "%";
        case "currency":
            if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
            if (Math.abs(n) >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
            return "$" + n.toFixed(0);
        case "rate_per_1000":
        case "rate_per_100k":
            return n.toFixed(1);
        case "binary":
            return n === 1 ? "Yes" : (n === 0 ? "No" : "");
        case "count":
        default:
            if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M";
            if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
            return n % 1 === 0 ? n.toString() : n.toFixed(1);
    }
};

/* Format a single value for tooltips and figure-source coverage strings. */
window._formatValue = function(format, val) {
    if (val === null || val === undefined || isNaN(val)) return "N/A";
    var n = Number(val);
    switch (format) {
        case "percent":
            return n.toFixed(1) + "%";
        case "currency":
            return "$" + Math.round(n).toLocaleString();
        case "rate_per_1000":
        case "rate_per_100k":
            return n.toFixed(1);
        case "binary":
            return n === 1 ? "Manorial" : (n === 0 ? "Non-manorial" : "");
        case "count":
        default:
            return Math.round(n).toLocaleString();
    }
};

/* Look up metadata, falling back to a default record. */
window._meta = function(code) {
    var m = window._variableMetadata && window._variableMetadata[code];
    if (m) return m;
    return {
        label: code, source: "Source not yet attributed.",
        unit: "", format: "count", palette: "sequential", geo_levels: []
    };
};
