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
    "salitre_production_dept": { label: "Nitrate production (department, 1911-1923)", source: "Sinopsis Estadistica de Chile 1924-27", unit: "metric tons", format: "count", palette: "sequential", geo_levels: ["department"] },
    "poblacion_censal_dept": { label: "Census population (department)", source: "Sinopsis Estadistica - Chile 1924-1927", unit: "persons", format: "count", palette: "sequential", geo_levels: ["department"] },
    "bautismos_1865_dept": { label: "Baptisms (department, 1865)", source: "Véjares, Maximiliano. Department-level historical dataset (Chile, 19th c.), author's compilation.", unit: "baptisms", format: "count", palette: "sequential", geo_levels: ["department"] },
    "defunciones_1865_dept": { label: "Parish-register deaths (department, 1865)", source: "Véjares, Maximiliano. Department-level historical dataset (Chile, 19th c.), author's compilation.", unit: "deaths", format: "count", palette: "sequential", geo_levels: ["department"] },
    "matrimonios_1865_dept": { label: "Parish-register marriages (department, 1865)", source: "Véjares, Maximiliano. Department-level historical dataset (Chile, 19th c.), author's compilation.", unit: "marriages", format: "count", palette: "sequential", geo_levels: ["department"] },
    "occ_agricultura_1920_dept": { label: "Agricultural workers (department, 1920)", source: "Censo 1920 (MC0043126)", unit: "workers", format: "count", palette: "sequential", geo_levels: ["department"] },
    "n_landowners_1875_dept": { label: "Landowners (department, 1875)", source: "Rol de Contribuyentes 1875", unit: "landowners", format: "count", palette: "sequential", geo_levels: ["department"] },
    "poblacion_total_titled_dept": { label: "Total population (department, 1920-1952)", source: "Censo 1952 (Memoria Chilena)", unit: "persons", format: "count", palette: "sequential", geo_levels: ["department"] },
    "poblacion_censal_prov": { label: "Census population (province)", source: "Sinopsis Estadistica - Chile 1924-1927", unit: "persons", format: "count", palette: "sequential", geo_levels: ["province"] },
    "alumnos_total_prov": { label: "Pupils enrolled (province, 1850s)", source: "Anuario Estadístico 1860, anuario_1860_fiscal_schools_province_1853_1855.csv", unit: "pupils", format: "count", palette: "sequential", geo_levels: ["province"] },
    "alumnos_hombres_prov": { label: "Male pupils enrolled (province, 1850s)", source: "Anuario Estadístico 1860, anuario_1860_fiscal_schools_province_1853_1855.csv", unit: "pupils", format: "count", palette: "sequential", geo_levels: ["province"] },
    "alumnos_mujeres_prov": { label: "Female pupils enrolled (province, 1850s)", source: "Anuario Estadístico 1860, anuario_1860_fiscal_schools_province_1853_1855.csv", unit: "pupils", format: "count", palette: "sequential", geo_levels: ["province"] },
    "escuelas_total_prov": { label: "Schools (province, 1850s)", source: "Anuario Estadístico 1860, anuario_1860_fiscal_schools_province_1853_1855.csv", unit: "schools", format: "count", palette: "sequential", geo_levels: ["province"] },
    "escuelas_hombres_prov": { label: "Boys' schools (province, 1850s)", source: "Anuario Estadístico 1860, anuario_1860_fiscal_schools_province_1853_1855.csv", unit: "schools", format: "count", palette: "sequential", geo_levels: ["province"] },
    "escuelas_mujeres_prov": { label: "Girls' schools (province, 1850s)", source: "Anuario Estadístico 1860, anuario_1860_fiscal_schools_province_1853_1855.csv", unit: "schools", format: "count", palette: "sequential", geo_levels: ["province"] },
    "crimenes_1859_prov": { label: "Crimes recorded (province, 1859)", source: "Anuario Estadístico 1860", unit: "crimes", format: "count", palette: "sequential", geo_levels: ["province"] },
    "casados_1854_prov": { label: "Married persons (province, 1854)", source: "Anuario Estadístico 1860, anuario_1860_civil_status_province_census1854.csv", unit: "persons", format: "count", palette: "sequential", geo_levels: ["province"] },
    "pct_inmigrantes_prov": { label: "In-migrants as a share of population (province, 1960)", source: "Datos pre 73'.xlsx", unit: "%", format: "percent", palette: "sequential", geo_levels: ["province"] },
    "occ_agricultores_1875_prov": { label: "Farmers (province, 1875)", source: "Censo Jeneral 1875 (MC0043456)", unit: "men", format: "count", palette: "sequential", geo_levels: ["province"] },
    "pct_protestante_prov": { label: "Protestant population share (province, 1960-1970)", source: "Datos pre 73'", unit: "%", format: "percent", palette: "sequential", geo_levels: ["province"] },
    "pct_urbana_prov": { label: "Urban population share (province, 1895-1920)", source: "Sinopsis Estadistica - Chile 1924-1927", unit: "%", format: "percent", palette: "sequential", geo_levels: ["province"] },
    "bfo_total_revenue": { label: "Total fiscal revenue (British Foreign Office returns)", source: "Aldana 1914. Resumen de la Hacienda Pública de Chile 1833-1914", unit: "GBP", format: "currency", palette: "sequential", geo_levels: ["national"] },
    "customs_revenue_nat": { label: "Customs revenue (British Foreign Office returns)", source: "Aldana 1914. Resumen de la Hacienda Pública de Chile 1833-1914", unit: "GBP", format: "currency", palette: "sequential", geo_levels: ["national"] },
    "budget_education_share": { label: "Education share of the national budget", source: "Datos Mamalakis", unit: "%", format: "percent", palette: "sequential", geo_levels: ["national"] },
    "active_population_nat": { label: "Economically active population", source: "Mamalakis Vol 2, Table 12.1 (Sergio De Castro 1979)", unit: "thousands of persons", format: "count", palette: "sequential", geo_levels: ["national"] },
    "education_spending_total": { label: "Public education expenditure", source: "Anuario Estadístico 1860", unit: "pesos", format: "currency", palette: "sequential", geo_levels: ["national"] },
    "votantes_nacional": { label: "Votes cast in national elections", source: "Datos pre 73'.xlsx", unit: "voters", format: "count", palette: "sequential", geo_levels: ["national"] },
    "employment_total_nat": { label: "Total employment", source: "Datos Mamalakis 1", unit: "persons", format: "count", palette: "sequential", geo_levels: ["national"] },
    "copper_export_duty_nat": { label: "Copper export duty rate", source: "Humud - Politica economica en Chile 1830-1930", unit: "%", format: "percent", palette: "sequential", geo_levels: ["national"] },
    "fiscal_expenditure_total_nat": { label: "Total fiscal expenditure", source: "Aldana 1914 Resumen Hacienda Publica Chile 1833-1914", unit: "pesos", format: "currency", palette: "sequential", geo_levels: ["national"] },
    "gov_current_revenue_nat": { label: "Government current revenue", source: "Datos pre 73'", unit: "pesos", format: "currency", palette: "sequential", geo_levels: ["national"] },
    "viviendas_nat": { label: "Dwellings", source: "Datos pre 73'", unit: "dwellings", format: "count", palette: "sequential", geo_levels: ["national"] },
    "menores_control_nat": { label: "Minors under state protective control", source: "Datos pre 73'.xlsx", unit: "minors", format: "count", palette: "sequential", geo_levels: ["national"] },
    "labor_obreros_share_nat": { label: "Manual workers as a share of the employed", source: "Datos pre 73'", unit: "%", format: "percent", palette: "sequential", geo_levels: ["national"] },
    "labor_force_quarterly_nat": { label: "Total labour force (quarterly survey)", source: "Datos Mamalakis 1", unit: "persons", format: "count", palette: "sequential", geo_levels: ["national"] },
    "desnutricion_total_nat": { label: "Child malnutrition rate", source: "Datos pre 73'.xlsx", unit: "%", format: "percent", palette: "sequential", geo_levels: ["national"] },
    "copper_production_value_nat": { label: "Copper production value", source: "Sinopsis Estadistica de Chile 1924-27", unit: "gold pesos (18d)", format: "currency", palette: "sequential", geo_levels: ["national"] },
    "mortality_rate_nat": { label: "Crude mortality rate", source: "Anuario Estadístico 1860", unit: "%", format: "percent", palette: "sequential", geo_levels: ["national"] },
    "pob_urbana_nat": { label: "Urban population", source: "Primary sources (see indicator metadata)", unit: "persons", format: "count", palette: "sequential", geo_levels: ["national"] },
    "real_income_nat": { label: "Average real income", source: "Datos pre 73'", unit: "index", format: "count", palette: "sequential", geo_levels: ["national"] },
    "social_spending_real_nat": { label: "Real social expenditure", source: "Datos pre 73'", unit: "index", format: "count", palette: "sequential", geo_levels: ["national"] },
    "exports_total_nat": { label: "Total exports", source: "Sinopsis Estadistica - Chile 1924-1927", unit: "pesos (18d)", format: "currency", palette: "sequential", geo_levels: ["national"] },
    "total_trade_nat": { label: "Total foreign trade", source: "Aldana, Abelardo. 1914. Resumen Hacienda Publica Chile 1833-1914", unit: "pesos", format: "currency", palette: "sequential", geo_levels: ["national"] },
    "unemployment_total_nat": { label: "Total unemployment (quarterly survey)", source: "Datos Mamalakis 1", unit: "persons", format: "count", palette: "sequential", geo_levels: ["national"] },
    "wages_total_nat": { label: "Average registered monthly wage", source: "Datos Mamalakis 1", unit: "pesos", format: "currency", palette: "sequential", geo_levels: ["national"] },
    "tariff_imports_avg": { label: "Average import tariff rate", source: "Primary sources (see indicator metadata)", unit: "%", format: "percent", palette: "sequential", geo_levels: ["national"] },
    "cpi_index": { label: "Consumer price index (1995 = 100)", source: "Primary sources (see indicator metadata)", unit: "index, 1995 = 100", format: "count", palette: "sequential", geo_levels: ["national"] },
    "fiscal_balance_gdp": { label: "Fiscal balance (% of GDP)", source: "Primary sources (see indicator metadata)", unit: "%", format: "percent", palette: "sequential", geo_levels: ["national"] },
    "labor_force_total": { label: "Labour force, total", source: "Primary sources (see indicator metadata)", unit: "workers", format: "count", palette: "sequential", geo_levels: ["national"] },
    "gross_fixed_capital": { label: "Gross fixed capital formation (real)", source: "Primary sources (see indicator metadata)", unit: "millions of 1995 pesos", format: "count", palette: "sequential", geo_levels: ["national"] },
    "fiscal_revenue_pesos": { label: "Total fiscal revenue (pesos)", source: "Aldana 1914. Resumen de la Hacienda Pública de Chile 1833-1914", unit: "pesos", format: "currency", palette: "sequential", geo_levels: ["national"] },
    "fiscal_revenue_gbp": { label: "Total fiscal revenue (British Foreign Office, GBP)", source: "Aldana 1914. Resumen de la Hacienda Pública de Chile 1833-1914", unit: "GBP", format: "currency", palette: "sequential", geo_levels: ["national"] },
    "birth_rate_national": { label: "Birth rate (per 1,000)", source: "Primary sources (see indicator metadata)", unit: "per 1,000 population", format: "count", palette: "sequential", geo_levels: ["national"] },
    "expenditure_per_capita_real": { label: "Government expenditure per capita", source: "Primary sources (see indicator metadata)", unit: "pesos (1995)", format: "count", palette: "sequential", geo_levels: ["national"] },
    "shipping_tonnage_entered": { label: "Shipping tonnage entered", source: "summary_finances_customs.csv", unit: "tons", format: "count", palette: "sequential", geo_levels: ["national"] },
    "mint_receipts_national": { label: "Mint receipts", source: "Aldana 1914. Resumen de la Hacienda Pública de Chile 1833-1914", unit: "pesos", format: "currency", palette: "sequential", geo_levels: ["national"] },
    "literates_subnational": { label: "People who can read (department, census years)", source: "Véjares, Maximiliano. Department-level historical dataset (Chile, 19th c.), author's compilation.", unit: "persons", format: "count", palette: "sequential", geo_levels: ["department"] },
    "land_tax_dept": { label: "Land tax assessed (department)", source: "Memoria de Hacienda - Chile 1856", unit: "pesos", format: "currency", palette: "sequential", geo_levels: ["department"] },
    "police_force_dept": { label: "Police force (department)", source: "Véjares, Maximiliano. Department-level historical dataset (Chile, 19th c.), author's compilation.", unit: "officers", format: "count", palette: "sequential", geo_levels: ["department"] },
    "school_matricula_ext_dept": { label: "School enrolment, matrícula (department, extended)", source: "Anuario Estadístico 1935 - Escuelas", unit: "pupils", format: "count", palette: "sequential", geo_levels: ["department"] },
    "court_cases_filed_prov": { label: "Court cases filed (province)", source: "Sinopsis estadistica i jeografica de Chile", unit: "cases", format: "count", palette: "sequential", geo_levels: ["province"] },
    "bank_offices_prov": { label: "Bank offices (province)", source: "Anuario Estadistico - Chile 1935.pdf", unit: "offices", format: "count", palette: "sequential", geo_levels: ["province"] },
    "wheat_1924_prov": { label: "Wheat harvested (province, 1924)", source: "Sinopsis Estadistica de Chile 1924-27", unit: "quintals", format: "count", palette: "sequential", geo_levels: ["province"] },
    "poblacion_intercensal_dept": { label: "Population (department, Memoria/Anuario series)", source: "Anuario Estadistico - Chile 1871.pdf", unit: "persons", format: "count", palette: "sequential", geo_levels: ["department"] },
    "correos_cartas_dept": { label: "Postal letters handled (department)", source: "Memoria del Interior - Chile 1883", unit: "letters", format: "count", palette: "sequential", geo_levels: ["department"] },
    "correos_impresos_dept": { label: "Postal printed matter handled (department)", source: "Memoria del Interior - Chile 1887", unit: "items", format: "count", palette: "sequential", geo_levels: ["department"] },
    "vacunados_dept": { label: "Smallpox vaccinations (department)", source: "Memoria del Interior - Chile 1890", unit: "persons vaccinated", format: "count", palette: "sequential", geo_levels: ["department"] },
    "viruela_defunciones_dept": { label: "Smallpox deaths (department)", source: "Memoria del Interior - Chile 1887", unit: "deaths", format: "count", palette: "sequential", geo_levels: ["department"] },
    "virus_repartido_dept": { label: "Smallpox vaccine distributed (department, 1889)", source: "Memoria del Interior - Chile 1890", unit: "doses", format: "count", palette: "sequential", geo_levels: ["department"] },
    "municipal_entradas_dept": { label: "Municipal revenue (department)", source: "Memoria del Interior - Chile 1877", unit: "pesos", format: "currency", palette: "sequential", geo_levels: ["department"] },
    "municipal_salidas_dept": { label: "Municipal expenditure (department)", source: "Memoria del Interior - Chile 1890", unit: "pesos", format: "currency", palette: "sequential", geo_levels: ["department"] },
    "escuelas_matricula_dept": { label: "Primary school enrolment (department, 1909)", source: "Anuario Estadistico - Chile 1909.pdf", unit: "pupils", format: "count", palette: "sequential", geo_levels: ["department"] },
    "escuelas_asistencia_dept": { label: "Primary school attendance (department, 1909)", source: "Anuario Estadistico - Chile 1909.pdf", unit: "pupils", format: "count", palette: "sequential", geo_levels: ["department"] },
    "bautismos_dept": { label: "Baptisms (department, 1869)", source: "Anuario Estadistico - Chile 1871.pdf", unit: "baptisms", format: "count", palette: "sequential", geo_levels: ["department"] },
    "defunciones_hist_dept": { label: "Registered deaths (department, 1869)", source: "Anuario Estadistico - Chile 1871.pdf", unit: "deaths", format: "count", palette: "sequential", geo_levels: ["department"] },
    "matrimonios_hist_dept": { label: "Marriages (department, 1869-1889)", source: "Anuario Estadistico - Chile 1871.pdf", unit: "marriages", format: "count", palette: "sequential", geo_levels: ["department"] },
    "schools_count_dept": { label: "Schools (department)", source: "Véjares, Maximiliano. Department-level historical dataset (Chile, 19th c.), author's compilation.", unit: "schools", format: "count", palette: "sequential", geo_levels: ["department"] },
    "post_offices_dept": { label: "Post offices (department)", source: "Véjares, Maximiliano. Department-level historical dataset (Chile, 19th c.), author's compilation.", unit: "offices", format: "count", palette: "sequential", geo_levels: ["department"] },
    "calificados_1869_dept": { label: "Qualified voters (department, 1869 roll)", source: "Anuario Estadistico - Chile 1871.pdf", unit: "voters", format: "count", palette: "sequential", geo_levels: ["department"] },
    "votos_municipales_1870_dept": { label: "Municipal-election votes cast (department, 1870)", source: "Anuario Estadistico - Chile 1871.pdf", unit: "votes", format: "count", palette: "sequential", geo_levels: ["department"] },
    "votos_presidente_1871_dept": { label: "Presidential-elector votes cast (department, 1871)", source: "Anuario Estadistico - Chile 1871.pdf", unit: "votes", format: "count", palette: "sequential", geo_levels: ["department"] },
    "hospitals_count_dept": { label: "Hospitals (department, 1930-1940)", source: "Véjares, Maximiliano. Department-level historical dataset (Chile, 19th c.), author's compilation.", unit: "hospitals", format: "count", palette: "sequential", geo_levels: ["department"] },
    "carceles_entrados_1869_prov": { label: "Prison admissions (province, 1869)", source: "Anuario Estadistico - Chile 1871.pdf", unit: "prisoners", format: "count", palette: "sequential", geo_levels: ["province"] },
    "reos_entrados_prov": { label: "Prisoners admitted (province, 1892-1900)", source: "Sinopsis estadistica i jeografica de Chile", unit: "prisoners", format: "count", palette: "sequential", geo_levels: ["province"] },
    "reos_aprehendidos_prov": { label: "Persons arrested (province, 1924-1925)", source: "Sinopsis Estadistica de Chile 1924-27", unit: "persons", format: "count", palette: "sequential", geo_levels: ["province"] },
    "hospital_admissions_prov": { label: "Hospital admissions (province, 1924)", source: "Sinopsis Estadistica de Chile 1924-27", unit: "admissions", format: "count", palette: "sequential", geo_levels: ["province"] },
    "hospital_beds_prov": { label: "Hospital beds (province, 1924)", source: "Sinopsis Estadistica de Chile 1924-27", unit: "beds", format: "count", palette: "sequential", geo_levels: ["province"] },
    "hospitals_count_prov": { label: "Hospitals (province, 1924)", source: "Sinopsis Estadistica de Chile 1924-27", unit: "hospitals", format: "count", palette: "sequential", geo_levels: ["province"] },
    "bankruptcies_prov": { label: "Bankruptcies declared (province)", source: "Anuario Estadistico - Chile 1935.pdf", unit: "bankruptcies", format: "count", palette: "sequential", geo_levels: ["province"] },
    "foreigners_1895_prov": { label: "Foreign-born population (province, 1895)", source: "Sinopsis Estadistica - Chile 1900.pdf", unit: "persons", format: "count", palette: "sequential", geo_levels: ["province"] },
    "senadores_1920_prov": { label: "Senators (province, 1920)", source: "Sinopsis Estadística 1924-27, p.39", unit: "senators", format: "count", palette: "sequential", geo_levels: ["province"] },
    "diputados_1920_prov": { label: "Deputies (province, 1920)", source: "Sinopsis Estadística 1924-27, p.39", unit: "deputies", format: "count", palette: "sequential", geo_levels: ["province"] },
    "nacimientos_1858_prov": { label: "Births (province, 1849-1858 decadal total)", source: "Anuario Estadistico - Chile 1860-1872", unit: "births", format: "count", palette: "sequential", geo_levels: ["province"] },
    "defunciones_1858_prov": { label: "Deaths (province, 1849-1858 decadal total)", source: "Anuario Estadistico - Chile 1860-1872", unit: "deaths", format: "count", palette: "sequential", geo_levels: ["province"] },
    "matrimonios_1858_prov": { label: "Marriages (province, 1849-1858 decadal total)", source: "Anuario Estadistico - Chile 1860-1872", unit: "marriages", format: "count", palette: "sequential", geo_levels: ["province"] },
    "patentes_prov": { label: "Business licences issued (province, 1852-1858)", source: "Anuario Estadistico - Chile 1860-1872", unit: "patentes", format: "count", palette: "sequential", geo_levels: ["province"] },
    "nacimientos_1924_prov": { label: "Births (province, 1924)", source: "Sinopsis Estadística 1924-27, p.32", unit: "births", format: "count", palette: "sequential", geo_levels: ["province"] },
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
        label: "Total population", source: "Primary sources (see indicator metadata)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Total Labor Force": {
        label: "Total labor force", source: "Primary sources (see indicator metadata)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Labor Participation Rate": {
        label: "Labor force participation rate", source: "Primary sources (see indicator metadata)",
        unit: "%", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Agricultural Workers": {
        label: "Agricultural workers", source: "Primary sources (see indicator metadata)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },
    "Mining Workers": {
        label: "Mining workers", source: "Primary sources (see indicator metadata)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#8a5a00"
    },
    "Manufacturing Workers": {
        label: "Manufacturing workers", source: "Primary sources (see indicator metadata)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#5a3b8a"
    },
    "Service Workers": {
        label: "Service workers", source: "Primary sources (see indicator metadata)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#3b6d11"
    },
    "Construction Workers": {
        label: "Construction workers", source: "Primary sources (see indicator metadata)",
        unit: "persons", format: "count", palette: "sequential",
        geo_levels: ["national"], accent: "#5a3b8a"
    },
    "Exports (millions 1995 pesos)": {
        label: "Exports", source: "Primary sources (see indicator metadata)",
        unit: "millions of 1995 pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Imports (millions 1995 pesos)": {
        label: "Imports", source: "Primary sources (see indicator metadata)",
        unit: "millions of 1995 pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },
    "Exports (% of GDP)": {
        label: "Exports", source: "Primary sources (see indicator metadata)",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Imports (% of GDP)": {
        label: "Imports", source: "Primary sources (see indicator metadata)",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },
    "Trade Openness (% of GDP)": {
        label: "Trade openness", source: "Primary sources (see indicator metadata)",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Fiscal Revenue (millions)": {
        label: "Fiscal revenue", source: "Primary sources (see indicator metadata)",
        unit: "millions of 1995 pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Fiscal Expenditure (millions)": {
        label: "Fiscal expenditure", source: "Primary sources (see indicator metadata)",
        unit: "millions of 1995 pesos", format: "currency", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },
    "Revenue (% of GDP)": {
        label: "Fiscal revenue", source: "Primary sources (see indicator metadata)",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#1f4e79"
    },
    "Expenditure (% of GDP)": {
        label: "Fiscal expenditure", source: "Primary sources (see indicator metadata)",
        unit: "% of GDP", format: "percent", palette: "sequential",
        geo_levels: ["national"], accent: "#8b0000"
    },
    "Fiscal Surplus (% of GDP)": {
        label: "Fiscal balance",
        source: "Primary sources (see indicator metadata)",
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

/* ===== SYNCED FROM variable_family_manifest.csv =====
   Source: extraction_output/variable_family_manifest.csv
   Source: extraction_output/variable_to_family_map.csv
   Methodology: methodology_log.md M016.
   These two namespaces are additive. Existing UI consumers that
   read window._variableMetadata are unaffected. Tools that want
   family-level metadata can do:
       var fid = window._variableToFamily[varCode];
       var meta = window._familyMetadata[fid];
   The full universe map (6,488 variables) is in the sidecar
   gis_platform/data/variable_to_family.json.
*/

window._variableToFamily = {
    alumnos_h: "school_enrollment_subnational",
    alumnos_m: "school_enrollment_subnational",
    alumnos_total: "school_enrollment_subnational",
    defunciones: "mortality_natality_long_series",
    densidad_hab_por_km2: "rural_urban_share_long_series",
    enfranchised: "electoral_subnational",
    enfranchised_peasant: "electoral_subnational",
    enfranchised_totalpop: "electoral_subnational",
    engineers: "occupations_canonical_subnational",
    escuelas_h: "school_enrollment_subnational",
    escuelas_m: "school_enrollment_subnational",
    escuelas_total: "school_enrollment_subnational",
    lawyer: "occupations_canonical_subnational",
    matrimonios: "mortality_natality_long_series",
    matrimonios_total: "marriages_age_cohort",
    military: "occupations_canonical_subnational",
    n_legislators: "landholding_avaluo",
    nacimientos: "mortality_natality_long_series",
    pct_pgb_provincial: "provincial_gdp_share_1966_1970",
    pct_poblacion_urbana: "rural_urban_share_long_series",
    peasant: "occupations_canonical_subnational",
    poblacion_rural: "urban_rural_population_subnational",
    poblacion_urbana: "urban_rural_population_subnational",
    police: "occupations_canonical_subnational",
    pres_has_gobernador: "state_officials_named",
    pres_has_juez: "state_officials_named",
    pres_has_reg_civil: "state_officials_named",
    pubemp: "occupations_canonical_subnational",
    pubemp_per_capita: "public_employment_subnational",
    superficie_km2: "geo_metadata_extended",
    tasa_matrimonios_por_mil: "mortality_natality_long_series",
    teacher: "occupations_canonical_subnational",
    total_population: "total_population_subnational",
    totexp: "fiscal_expenditure_categorical",
};

window._familyMetadata = {
    administrative_divisions: { display_name: "Administrative divisions (number of departments / communes)", geo_levels: ["national", "province"], n_member_variables: 2, n_observations: 76, per_capita_default: "default_raw", source_type: "anuario", units: "count", valid_years_pattern: "1928-1928", zeros_are_real: "never" },
    age_specific_fertility: { display_name: "Age-specific fertility rates", geo_levels: ["country"], n_member_variables: 27, n_observations: 123, per_capita_default: "default_raw", source_type: "compiled", units: "rate", valid_years_pattern: "1960-1970", zeros_are_real: "never" },
    agrarian_labor_indicators: { display_name: "Agrarian labor indicators (inquilinos, enfiteutas, dual-tenure)", geo_levels: ["nan"], n_member_variables: 0, n_observations: 0, per_capita_default: "default_pc", source_type: "external_academic", units: "count", valid_years_pattern: "nan", zeros_are_real: "sometimes" },
    agricultural_census_1930_commune: { display_name: "1930 Agricultural Census, commune level (size classes)", geo_levels: ["comuna"], n_member_variables: 16, n_observations: 3081, per_capita_default: "user_choice", source_type: "census", units: "count", valid_years_pattern: "1930-1930", zeros_are_real: "sometimes" },
    agriculture_province_1924: { display_name: "Agriculture province 1924 (papas, trigo_blanco)", geo_levels: ["provincia"], n_member_variables: 6, n_observations: 248, per_capita_default: "user_choice", source_type: "anuario", units: "physical_quantity", valid_years_pattern: "1924-1924", zeros_are_real: "sometimes" },
    agriculture_province_1935: { display_name: "Agriculture/livestock province 1935", geo_levels: ["departamento", "province", "provincia"], n_member_variables: 29, n_observations: 961, per_capita_default: "user_choice", source_type: "anuario", units: "physical_quantity", valid_years_pattern: "1855-1935", zeros_are_real: "sometimes" },
    anuario_1875_trailing_year: { display_name: "Anuario 1875 trailing-year columns", geo_levels: ["nan"], n_member_variables: 0, n_observations: 0, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "nan", zeros_are_real: "sometimes" },
    auto_alumnos_h_yyyy: { display_name: "Auto Alumnos H Yyyy", geo_levels: ["province"], n_member_variables: 3, n_observations: 54, per_capita_default: "user_choice", source_type: "compiled", units: "count", valid_years_pattern: "1855-1858", zeros_are_real: "never" },
    auto_alumnos_m_yyyy: { display_name: "Auto Alumnos M Yyyy", geo_levels: ["province"], n_member_variables: 3, n_observations: 54, per_capita_default: "user_choice", source_type: "compiled", units: "count", valid_years_pattern: "1855-1858", zeros_are_real: "never" },
    auto_alumnos_total_yyyy: { display_name: "Auto Alumnos Total Yyyy", geo_levels: ["province"], n_member_variables: 3, n_observations: 54, per_capita_default: "user_choice", source_type: "compiled", units: "count", valid_years_pattern: "1855-1858", zeros_are_real: "never" },
    auto_entrada_periodo_yyyy_yyyy_ordinaria_pesos: { display_name: "Auto Entrada Periodo Yyyy Yyyy Ordinaria Pesos", geo_levels: ["national"], n_member_variables: 3, n_observations: 6, per_capita_default: "user_choice", source_type: "compiled", units: "count", valid_years_pattern: "1900-1900", zeros_are_real: "never" },
    auto_escuelas_h_yyyy: { display_name: "Auto Escuelas H Yyyy", geo_levels: ["province"], n_member_variables: 3, n_observations: 54, per_capita_default: "user_choice", source_type: "compiled", units: "count", valid_years_pattern: "1855-1858", zeros_are_real: "never" },
    auto_escuelas_m_yyyy: { display_name: "Auto Escuelas M Yyyy", geo_levels: ["province"], n_member_variables: 3, n_observations: 54, per_capita_default: "user_choice", source_type: "compiled", units: "count", valid_years_pattern: "1855-1858", zeros_are_real: "never" },
    auto_escuelas_total_yyyy: { display_name: "Auto Escuelas Total Yyyy", geo_levels: ["province"], n_member_variables: 3, n_observations: 54, per_capita_default: "user_choice", source_type: "compiled", units: "count", valid_years_pattern: "1855-1858", zeros_are_real: "never" },
    auto_pop_censal_yyyy: { display_name: "Auto Pop Censal Yyyy", geo_levels: ["department", "national", "province"], n_member_variables: 6, n_observations: 1181, per_capita_default: "user_choice", source_type: "compiled", units: "count", valid_years_pattern: "1865-1920", zeros_are_real: "never" },
    auto_vacunados_yyyy_hombres: { display_name: "Auto Vacunados Yyyy Hombres", geo_levels: ["department", "national", "province"], n_member_variables: 3, n_observations: 329, per_capita_default: "user_choice", source_type: "compiled", units: "count", valid_years_pattern: "1862-1889", zeros_are_real: "never" },
    auto_vacunados_yyyy_mujeres: { display_name: "Auto Vacunados Yyyy Mujeres", geo_levels: ["department", "national", "province"], n_member_variables: 3, n_observations: 326, per_capita_default: "user_choice", source_type: "compiled", units: "count", valid_years_pattern: "1862-1889", zeros_are_real: "never" },
    auto_vacunados_yyyy_total: { display_name: "Auto Vacunados Yyyy Total", geo_levels: ["department", "national", "province"], n_member_variables: 3, n_observations: 367, per_capita_default: "user_choice", source_type: "compiled", units: "count", valid_years_pattern: "1862-1889", zeros_are_real: "never" },
    auto_yyyy_yyyy: { display_name: "Auto Yyyy Yyyy", geo_levels: ["national"], n_member_variables: 6, n_observations: 18, per_capita_default: "user_choice", source_type: "compiled", units: "count", valid_years_pattern: "1960-1970", zeros_are_real: "never" },
    banking_subnational: { display_name: "Banking offices by province (commercial banks, savings bank)", geo_levels: ["national", "province"], n_member_variables: 10, n_observations: 400, per_capita_default: "default_raw", source_type: "anuario", units: "count", valid_years_pattern: "1935-1935", zeros_are_real: "always" },
    bankruptcies_subnational: { display_name: "Bankruptcies declared by province", geo_levels: ["national", "province"], n_member_variables: 1, n_observations: 120, per_capita_default: "default_raw", source_type: "anuario", units: "count", valid_years_pattern: "1933-1935", zeros_are_real: "always" },
    british_foreign_office_fiscal_gbp: { display_name: "British Foreign Office: Chilean fiscal (GBP)", geo_levels: ["national"], n_member_variables: 20, n_observations: 851, per_capita_default: "user_choice", source_type: "external_academic", units: "currency_gbp", valid_years_pattern: "1833-1914", zeros_are_real: "sometimes" },
    british_foreign_office_sof: { display_name: "British Foreign Office (alternate sof_ source variant)", geo_levels: ["national"], n_member_variables: 11, n_observations: 202, per_capita_default: "user_choice", source_type: "external_academic", units: "currency_gbp", valid_years_pattern: "1837-1860", zeros_are_real: "sometimes" },
    budget: { display_name: "Annual budget (presupuestos)", geo_levels: ["country", "national"], n_member_variables: 4, n_observations: 81, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1833-1940", zeros_are_real: "never" },
    chilean_fiscal_pesos: { display_name: "Chilean fiscal: customs / tax / revenue in pesos", geo_levels: ["national", "port"], n_member_variables: 19, n_observations: 1347, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1833-1930", zeros_are_real: "sometimes" },
    church_records_baptisms: { display_name: "Baptisms (church records)", geo_levels: ["department"], n_member_variables: 1, n_observations: 51, per_capita_default: "default_pc", source_type: "compiled", units: "count", valid_years_pattern: "1865-1865", zeros_are_real: "never" },
    church_records_deaths: { display_name: "Deaths (church records)", geo_levels: ["department"], n_member_variables: 1, n_observations: 25, per_capita_default: "default_pc", source_type: "compiled", units: "count", valid_years_pattern: "1865-1865", zeros_are_real: "never" },
    church_records_marriages: { display_name: "Marriages (church records)", geo_levels: ["department"], n_member_variables: 1, n_observations: 49, per_capita_default: "default_pc", source_type: "compiled", units: "count", valid_years_pattern: "1865-1865", zeros_are_real: "never" },
    court_statistics: { display_name: "Court statistics (causas civiles / criminales)", geo_levels: ["province"], n_member_variables: 6, n_observations: 150, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1899-1899", zeros_are_real: "sometimes" },
    crime_statistics_1859: { display_name: "Crime statistics 1859 (crime_contra_*)", geo_levels: ["province"], n_member_variables: 10, n_observations: 160, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1859-1859", zeros_are_real: "sometimes" },
    crime_statistics_criminales: { display_name: "Crime statistics (criminales by crime type / estado civil)", geo_levels: ["national"], n_member_variables: 155, n_observations: 310, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1869-1869", zeros_are_real: "sometimes" },
    customs_revenue: { display_name: "Customs revenue (aduanas)", geo_levels: ["national"], n_member_variables: 2, n_observations: 98, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1817-1890", zeros_are_real: "sometimes" },
    demographic_indices_1976: { display_name: "Demographic indices (dependency, masculinity, ageing)", geo_levels: ["country", "region"], n_member_variables: 3, n_observations: 30, per_capita_default: "default_raw", source_type: "compiled", units: "rate", valid_years_pattern: "1976-1976", zeros_are_real: "never" },
    dlw_commodity_production: { display_name: "Commodity production volumes (national long series)", geo_levels: ["departamento", "national", "provincia"], n_member_variables: 19, n_observations: 3906, per_capita_default: "user_choice", source_type: "compiled", units: "physical_quantity", valid_years_pattern: "1860-1995", zeros_are_real: "sometimes" },
    dlw_demographics_capitalized: { display_name: "National demographic series", geo_levels: ["national"], n_member_variables: 8, n_observations: 1636, per_capita_default: "default_raw", source_type: "compiled", units: "rate", valid_years_pattern: "1810-1995", zeros_are_real: "never" },
    dlw_exports_categorical_lower: { display_name: "Exports by sector (national)", geo_levels: ["national"], n_member_variables: 8, n_observations: 2432, per_capita_default: "user_choice", source_type: "compiled", units: "currency_usd", valid_years_pattern: "1844-1995", zeros_are_real: "sometimes" },
    dlw_fiscal_capitalized: { display_name: "National fiscal series", geo_levels: ["national"], n_member_variables: 33, n_observations: 4582, per_capita_default: "default_raw", source_type: "compiled", units: "currency_pesos_1995", valid_years_pattern: "1810-1995", zeros_are_real: "sometimes" },
    dlw_fiscal_share_series: { display_name: "Fiscal composition shares (national)", geo_levels: ["national"], n_member_variables: 13, n_observations: 2826, per_capita_default: "default_raw", source_type: "compiled", units: "pct", valid_years_pattern: "1810-1995", zeros_are_real: "sometimes" },
    dlw_gdp_series: { display_name: "National accounts: GDP series", geo_levels: ["national"], n_member_variables: 6, n_observations: 2226, per_capita_default: "default_raw", source_type: "compiled", units: "currency_pesos_1995", valid_years_pattern: "1810-1995", zeros_are_real: "never" },
    dlw_imports_categorical_lower: { display_name: "Imports by category (national)", geo_levels: ["national"], n_member_variables: 8, n_observations: 1504, per_capita_default: "user_choice", source_type: "compiled", units: "currency_usd", valid_years_pattern: "1844-1937", zeros_are_real: "sometimes" },
    dlw_investment_capitalized: { display_name: "Investment and capital formation (national)", geo_levels: ["national"], n_member_variables: 12, n_observations: 672, per_capita_default: "default_raw", source_type: "compiled", units: "currency_pesos_1995", valid_years_pattern: "1940-1995", zeros_are_real: "sometimes" },
    dlw_labor_capitalized: { display_name: "Labour force series (national)", geo_levels: ["national"], n_member_variables: 20, n_observations: 3321, per_capita_default: "default_pc", source_type: "compiled", units: "count", valid_years_pattern: "1810-1995", zeros_are_real: "never" },
    dlw_labor_force_national: { display_name: "Labour force shares (national)", geo_levels: ["national"], n_member_variables: 13, n_observations: 4806, per_capita_default: "default_raw", source_type: "compiled", units: "pct", valid_years_pattern: "1810-1995", zeros_are_real: "never" },
    dlw_monetary_capitalized: { display_name: "Monetary aggregates and price indices (national)", geo_levels: ["national"], n_member_variables: 36, n_observations: 5760, per_capita_default: "default_raw", source_type: "compiled", units: "index", valid_years_pattern: "1810-1995", zeros_are_real: "never" },
    dlw_pib_capitalized: { display_name: "National accounts: GDP (nominal, real, sectoral)", geo_levels: ["country", "national"], n_member_variables: 25, n_observations: 5552, per_capita_default: "default_raw", source_type: "compiled", units: "currency_pesos_1995", valid_years_pattern: "1810-1995", zeros_are_real: "never" },
    dlw_trade_series: { display_name: "Trade series (national)", geo_levels: ["national"], n_member_variables: 13, n_observations: 4806, per_capita_default: "user_choice", source_type: "compiled", units: "currency_pesos_1995", valid_years_pattern: "1810-1995", zeros_are_real: "sometimes" },
    economic_activity_provincial: { display_name: "Provincial economic activity panel (1952-1970, holding pen)", geo_levels: ["country", "province"], n_member_variables: 14, n_observations: 1106, per_capita_default: "default_pc", source_type: "compiled", units: "count", valid_years_pattern: "1854-1983", zeros_are_real: "sometimes" },
    economically_active_population: { display_name: "Economically active population (PEA)", geo_levels: ["country", "national"], n_member_variables: 25, n_observations: 336, per_capita_default: "default_pc", source_type: "compiled", units: "count", valid_years_pattern: "1860-1995", zeros_are_real: "never" },
    education_enrollment_matricula: { display_name: "Education enrollment (matrícula, anuario series)", geo_levels: ["national", "province"], n_member_variables: 19, n_observations: 1915, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1852-1995", zeros_are_real: "never" },
    education_matricula_extended: { display_name: "Education matrícula and asistencia (1891-1935)", geo_levels: ["department", "national", "province"], n_member_variables: 14, n_observations: 565, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1891-1990", zeros_are_real: "never" },
    education_spending: { display_name: "Education expenditure (categorical)", geo_levels: ["national"], n_member_variables: 14, n_observations: 120, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1850-1858", zeros_are_real: "sometimes" },
    educational_attainment_subnational: { display_name: "Educational attainment (con instrucción primaria/secundaria/universitaria)", geo_levels: ["national", "province"], n_member_variables: 18, n_observations: 936, per_capita_default: "default_pc", source_type: "census", units: "count", valid_years_pattern: "1952-1952", zeros_are_real: "sometimes" },
    electoral_municipal_subnational: { display_name: "Municipal elections (votos emitidos, número de municipales)", geo_levels: ["department", "national"], n_member_variables: 2, n_observations: 220, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1870-1870", zeros_are_real: "sometimes" },
    electoral_participation_1935_1970_national: { display_name: "Electoral participation national 1935-1970 (Inscritas, Votantes, Abstención)", geo_levels: ["national"], n_member_variables: 5, n_observations: 50, per_capita_default: "default_raw", source_type: "compiled", units: "count", valid_years_pattern: "1930-1970", zeros_are_real: "sometimes" },
    electoral_presidential_subnational: { display_name: "Presidential-elector elections (votos emitidos, número de electores)", geo_levels: ["department", "national"], n_member_variables: 2, n_observations: 219, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1871-1871", zeros_are_real: "sometimes" },
    electoral_subnational: { display_name: "Electoral panel (calificados, inscriptos, sufragantes)", geo_levels: ["department", "national", "province"], n_member_variables: 19, n_observations: 3173, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1862-1935", zeros_are_real: "never" },
    employment_quarterly_sectoral: { display_name: "Employment by sector (quarterly, 1957-)", geo_levels: ["country", "national"], n_member_variables: 537, n_observations: 538, per_capita_default: "default_pc", source_type: "compiled", units: "count", valid_years_pattern: "1941-1978", zeros_are_real: "never" },
    ethnicity_indigenous: { display_name: "Ethnicity / indigenous population (Mapuche, Mestizo, Indios)", geo_levels: ["national"], n_member_variables: 2, n_observations: 3, per_capita_default: "default_pc", source_type: "census", units: "count", valid_years_pattern: "1811-1928", zeros_are_real: "sometimes" },
    exchange_rate: { display_name: "Exchange rate", geo_levels: ["national"], n_member_variables: 1, n_observations: 68, per_capita_default: "default_raw", source_type: "compiled", units: "rate", valid_years_pattern: "1830-1897", zeros_are_real: "never" },
    expenditure_per_capita: { display_name: "Expenditure per capita (derived)", geo_levels: ["national"], n_member_variables: 1, n_observations: 342, per_capita_default: "default_raw", source_type: "compiled", units: "currency_pesos", valid_years_pattern: "1810-1995", zeros_are_real: "never" },
    export_duties: { display_name: "Export duties by commodity (copper, salitre, gold, silver, wheat)", geo_levels: ["national"], n_member_variables: 11, n_observations: 30, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1834-1929", zeros_are_real: "sometimes" },
    fiscal_categorical_lower: { display_name: "Fiscal categorical lowercase (fiscal_derechos_, fiscal_gasto_, fiscal_rentas_)", geo_levels: ["national", "province"], n_member_variables: 17, n_observations: 121, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1900-1914", zeros_are_real: "sometimes" },
    fiscal_expenditure_categorical: { display_name: "Fiscal expenditure (categorical)", geo_levels: ["country", "department", "national", "province"], n_member_variables: 57, n_observations: 1921, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1817-1988", zeros_are_real: "sometimes" },
    fiscal_revenue_categorical: { display_name: "Fiscal revenue (categorical)", geo_levels: ["department", "national"], n_member_variables: 23, n_observations: 1036, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1810-1995", zeros_are_real: "sometimes" },
    foreigners_subnational: { display_name: "Chileans and foreigners by province (census)", geo_levels: ["national", "province"], n_member_variables: 6, n_observations: 308, per_capita_default: "default_pc", source_type: "census", units: "count", valid_years_pattern: "1952-1952", zeros_are_real: "sometimes" },
    geo_metadata: { display_name: "Geographic metadata (codes, coordinates)", geo_levels: ["nan"], n_member_variables: 0, n_observations: 0, per_capita_default: "not_applicable", source_type: "compiled", units: "categorical", valid_years_pattern: "nan", zeros_are_real: "always" },
    geo_metadata_extended: { display_name: "Geographic metadata extended (lat, lon, capital, surface)", geo_levels: ["comuna", "department", "national", "province"], n_member_variables: 4, n_observations: 250, per_capita_default: "not_applicable", source_type: "compiled", units: "categorical", valid_years_pattern: "1854-1952", zeros_are_real: "always" },
    government_accounts: { display_name: "Government accounts (cuenta_gobierno_*)", geo_levels: ["country"], n_member_variables: 182, n_observations: 780, per_capita_default: "user_choice", source_type: "compiled", units: "currency_pesos", valid_years_pattern: "1960-1970", zeros_are_real: "sometimes" },
    hospital_statistics: { display_name: "Hospital statistics (admissions, beds, deaths, expenses, subsidies)", geo_levels: ["city", "department", "national", "province", "provincia"], n_member_variables: 86, n_observations: 4077, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1840-1940", zeros_are_real: "sometimes" },
    household_consumption_indicators: { display_name: "Household consumption indicators (calidad_vida_*, equip_hogar_*, pct_hogares_*)", geo_levels: ["country", "national"], n_member_variables: 86, n_observations: 94, per_capita_default: "default_raw", source_type: "compiled", units: "pct", valid_years_pattern: "1970-1982", zeros_are_real: "never" },
    household_dwellings: { display_name: "Household dwellings panel (cities, conventillos, hacinamiento)", geo_levels: ["national"], n_member_variables: 12, n_observations: 12, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1860-1907", zeros_are_real: "sometimes" },
    housing_surface: { display_name: "Building and housing surface (1952-1999)", geo_levels: ["country"], n_member_variables: 12, n_observations: 320, per_capita_default: "default_pc", source_type: "compiled", units: "physical_quantity", valid_years_pattern: "1952-2000", zeros_are_real: "sometimes" },
    juvenile_justice: { display_name: "Juvenile justice (Menores Bajo Control)", geo_levels: ["national"], n_member_variables: 1, n_observations: 9, per_capita_default: "default_pc", source_type: "compiled", units: "count", valid_years_pattern: "1975-1983", zeros_are_real: "never" },
    labor_disputes: { display_name: "Labor disputes (huelgas, trabajadores afectados)", geo_levels: ["country"], n_member_variables: 4, n_observations: 4, per_capita_default: "default_pc", source_type: "compiled", units: "count", valid_years_pattern: "1955-1955", zeros_are_real: "sometimes" },
    labor_force_participation_extended: { display_name: "Labor force participation extended (ocupacion, pct_poblacion_12plus, etc.)", geo_levels: ["country", "national"], n_member_variables: 42, n_observations: 149, per_capita_default: "default_pc", source_type: "compiled", units: "count", valid_years_pattern: "1853-1976", zeros_are_real: "sometimes" },
    labor_force_quarterly_sectoral: { display_name: "Labor force by sector (quarterly, 1957-)", geo_levels: ["country"], n_member_variables: 1085, n_observations: 1091, per_capita_default: "default_pc", source_type: "compiled", units: "count", valid_years_pattern: "1940-1978", zeros_are_real: "never" },
    land_area_subnational: { display_name: "Land area (superficie, km2)", geo_levels: ["national", "province"], n_member_variables: 1, n_observations: 52, per_capita_default: "default_raw", source_type: "census", units: "physical_quantity", valid_years_pattern: "1952-1952", zeros_are_real: "never" },
    landholding_avaluo: { display_name: "Landholding: avaluo and Rol", geo_levels: ["constituency", "department"], n_member_variables: 23, n_observations: 5876, per_capita_default: "user_choice", source_type: "compiled", units: "currency_pesos", valid_years_pattern: "1830-1970", zeros_are_real: "never" },
    landholding_extended: { display_name: "Landholding extended (sna_ totals, 1875 landowners, dept aggregates)", geo_levels: ["department", "province"], n_member_variables: 9, n_observations: 420, per_capita_default: "user_choice", source_type: "external_academic", units: "count", valid_years_pattern: "1874-1878", zeros_are_real: "sometimes" },
    landholding_manorial: { display_name: "Landholding: manorial classification", geo_levels: ["department"], n_member_variables: 2, n_observations: 621, per_capita_default: "not_applicable", source_type: "external_academic", units: "boolean", valid_years_pattern: "1865-1970", zeros_are_real: "always" },
    landholding_sna: { display_name: "Landholding: SNA estates 1874", geo_levels: ["department"], n_member_variables: 4, n_observations: 1242, per_capita_default: "user_choice", source_type: "external_academic", units: "count", valid_years_pattern: "1865-1970", zeros_are_real: "sometimes" },
    legislators_province_1920: { display_name: "Legislators by province 1920 (senadores, diputados)", geo_levels: ["province"], n_member_variables: 2, n_observations: 92, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1920-1920", zeros_are_real: "sometimes" },
    life_expectancy_provincial: { display_name: "Life expectancy provincial (esperanza_vida_*)", geo_levels: ["national", "province", "region"], n_member_variables: 12, n_observations: 126, per_capita_default: "default_raw", source_type: "compiled", units: "rate", valid_years_pattern: "1854-1972", zeros_are_real: "never" },
    literacy_subnational: { display_name: "Literacy (subnational, by census year)", geo_levels: ["country", "department", "national", "province"], n_member_variables: 27, n_observations: 647, per_capita_default: "default_raw", source_type: "census", units: "rate", valid_years_pattern: "1854-1970", zeros_are_real: "never" },
    macroeconomic_indicators: { display_name: "Macroeconomic indicators (PIB growth, employment, inflation, savings)", geo_levels: ["country"], n_member_variables: 14, n_observations: 28, per_capita_default: "default_raw", source_type: "compiled", units: "rate", valid_years_pattern: "1989-1990", zeros_are_real: "sometimes" },
    malnutrition_indicators: { display_name: "Malnutrition indicators (Desnutrición *, national 1975-1983)", geo_levels: ["national"], n_member_variables: 4, n_observations: 32, per_capita_default: "default_raw", source_type: "compiled", units: "pct", valid_years_pattern: "1975-1983", zeros_are_real: "never" },
    marital_status_subnational: { display_name: "Marital status (casados, solteros, viudos, convivientes, etc.)", geo_levels: ["national", "province"], n_member_variables: 34, n_observations: 1321, per_capita_default: "default_pc", source_type: "census", units: "count", valid_years_pattern: "1854-1952", zeros_are_real: "sometimes" },
    marriages_age_cohort: { display_name: "Marriages by age cohort", geo_levels: ["country", "department", "national", "province"], n_member_variables: 19, n_observations: 850, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1858-1973", zeros_are_real: "sometimes" },
    migration_internal: { display_name: "Migration (internal / regional, net rates and shares)", geo_levels: ["country", "province", "region"], n_member_variables: 9, n_observations: 123, per_capita_default: "default_pc", source_type: "compiled", units: "count", valid_years_pattern: "1878-1982", zeros_are_real: "sometimes" },
    military_force_count: { display_name: "Military force counts (ejercito, marina, guardia)", geo_levels: ["national"], n_member_variables: 51, n_observations: 361, per_capita_default: "default_pc", source_type: "memoria", units: "count", valid_years_pattern: "1833-1922", zeros_are_real: "sometimes" },
    mining_establishments: { display_name: "Mining establishments by class (mines, labores, annual output, workers)", geo_levels: ["department", "province"], n_member_variables: 19, n_observations: 84, per_capita_default: "default_raw", source_type: "anuario", units: "count", valid_years_pattern: "1870-1870", zeros_are_real: "sometimes" },
    mining_production_pesos_oro: { display_name: "Mining production (pesos oro de 18 peniques, 1918-1923)", geo_levels: ["nacional"], n_member_variables: 4, n_observations: 44, per_capita_default: "user_choice", source_type: "anuario", units: "currency_pesos_oro_18d", valid_years_pattern: "1918-1923", zeros_are_real: "sometimes" },
    mining_production_subnational: { display_name: "Mining production by province (physical output)", geo_levels: ["national", "province"], n_member_variables: 2, n_observations: 36, per_capita_default: "default_raw", source_type: "anuario", units: "physical_quantity", valid_years_pattern: "1914-1914", zeros_are_real: "sometimes" },
    mining_value_subnational: { display_name: "Mining production value by province (pesos)", geo_levels: ["national", "province"], n_member_variables: 1, n_observations: 40, per_capita_default: "default_raw", source_type: "anuario", units: "currency_pesos", valid_years_pattern: "1914-1914", zeros_are_real: "sometimes" },
    ministry_budget_1845_1878: { display_name: "Sinopsis ministry budget panel 1845-1878 (interior, hacienda, etc.)", geo_levels: ["national", "province"], n_member_variables: 1, n_observations: 82, per_capita_default: "user_choice", source_type: "sinopsis", units: "currency_pesos", valid_years_pattern: "1827-1862", zeros_are_real: "sometimes" },
    monetary_minting: { display_name: "Mint receipts and monetary aggregates", geo_levels: ["national"], n_member_variables: 2, n_observations: 135, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1833-1894", zeros_are_real: "sometimes" },
    mortality_categorical: { display_name: "Mortality by cause / category", geo_levels: ["country", "department", "national", "province"], n_member_variables: 23, n_observations: 351, per_capita_default: "default_raw", source_type: "anuario", units: "rate", valid_years_pattern: "1849-1975", zeros_are_real: "sometimes" },
    mortality_natality_long_series: { display_name: "Mortality / natality long series (lowercase)", geo_levels: ["country", "department", "national", "province"], n_member_variables: 97, n_observations: 4326, per_capita_default: "default_raw", source_type: "compiled", units: "rate", valid_years_pattern: "1848-1995", zeros_are_real: "never" },
    municipal_finance: { display_name: "Municipal finance (revenue, expenditure, share)", geo_levels: ["city", "commune", "department", "national", "province"], n_member_variables: 43, n_observations: 2676, per_capita_default: "user_choice", source_type: "sinopsis", units: "currency_pesos", valid_years_pattern: "1861-1935", zeros_are_real: "sometimes" },
    natality_categorical: { display_name: "Natality / birth rate categorical", geo_levels: ["national"], n_member_variables: 1, n_observations: 296, per_capita_default: "default_raw", source_type: "anuario", units: "rate", valid_years_pattern: "1848-1995", zeros_are_real: "never" },
    national_accounts_numbered: { display_name: "National accounts numbered Spanish categories (1.-12.)", geo_levels: ["national"], n_member_variables: 17, n_observations: 240, per_capita_default: "user_choice", source_type: "compiled", units: "currency_pesos", valid_years_pattern: "1960-1970", zeros_are_real: "sometimes" },
    occupation_categories_subnational: { display_name: "Census occupation aggregates (profesion_cat_*)", geo_levels: ["department"], n_member_variables: 18, n_observations: 628, per_capita_default: "default_pc", source_type: "census", units: "count", valid_years_pattern: "1920-1920", zeros_are_real: "never" },
    occupations_canonical_subnational: { display_name: "Census occupations (canonical, subnational)", geo_levels: ["department", "province"], n_member_variables: 7, n_observations: 3084, per_capita_default: "default_pc", source_type: "census", units: "count", valid_years_pattern: "1862-1920", zeros_are_real: "never" },
    occupations_profesion_subnational: { display_name: "Census detailed occupations (profesion_*)", geo_levels: ["national", "province"], n_member_variables: 1880, n_observations: 9133, per_capita_default: "default_pc", source_type: "census", units: "count", valid_years_pattern: "1875-1875", zeros_are_real: "never" },
    occupations_year_prefix_19c: { display_name: "Occupations panel year-prefix 19c (1862_*, 1878_*, etc.)", geo_levels: ["nan"], n_member_variables: 0, n_observations: 0, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "nan", zeros_are_real: "sometimes" },
    police_subnational: { display_name: "Police force subnational (n_police_force, police_budget, police20)", geo_levels: ["department"], n_member_variables: 2, n_observations: 46, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1895-1920", zeros_are_real: "sometimes" },
    population_density: { display_name: "Population density (per km2)", geo_levels: ["national", "province"], n_member_variables: 2, n_observations: 55, per_capita_default: "default_raw", source_type: "compiled", units: "rate", valid_years_pattern: "1831-1952", zeros_are_real: "never" },
    population_growth: { display_name: "Population growth", geo_levels: ["national"], n_member_variables: 2, n_observations: 591, per_capita_default: "default_raw", source_type: "compiled", units: "rate", valid_years_pattern: "1848-1995", zeros_are_real: "sometimes" },
    population_subset_demographic: { display_name: "Population subsets (age, sex, ethnicity)", geo_levels: ["country", "national"], n_member_variables: 34, n_observations: 134, per_capita_default: "default_pc", source_type: "census", units: "count", valid_years_pattern: "1865-1992", zeros_are_real: "never" },
    port_shipping_volume: { display_name: "Port shipping volume (tonnage, vessels, maritime entries/exits)", geo_levels: ["national"], n_member_variables: 4, n_observations: 299, per_capita_default: "user_choice", source_type: "memoria", units: "count", valid_years_pattern: "1874-1914", zeros_are_real: "sometimes" },
    post_offices: { display_name: "Post offices count (subnational)", geo_levels: ["department"], n_member_variables: 3, n_observations: 96, per_capita_default: "user_choice", source_type: "sinopsis", units: "count", valid_years_pattern: "1865-1920", zeros_are_real: "sometimes" },
    postal_volume: { display_name: "Postal volume (cartas, impresos, oficios)", geo_levels: ["city", "department", "national", "province"], n_member_variables: 90, n_observations: 3281, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1831-1935", zeros_are_real: "sometimes" },
    prisons: { display_name: "Prison / corrections (reos, presidios, correccionales)", geo_levels: ["city", "national", "province", "provincia"], n_member_variables: 98, n_observations: 1559, per_capita_default: "default_pc", source_type: "memoria", units: "count", valid_years_pattern: "1869-1935", zeros_are_real: "sometimes" },
    production_categorical: { display_name: "Production categories (manufact, naturales, materias)", geo_levels: ["national", "province"], n_member_variables: 12, n_observations: 135, per_capita_default: "user_choice", source_type: "anuario", units: "count", valid_years_pattern: "1831-1881", zeros_are_real: "sometimes" },
    provincial_gdp_share_1966_1970: { display_name: "Provincial GDP shares and growth (1966-1970)", geo_levels: ["province", "region"], n_member_variables: 4, n_observations: 167, per_capita_default: "default_raw", source_type: "compiled", units: "pct", valid_years_pattern: "1966-1970", zeros_are_real: "sometimes" },
    public_debt: { display_name: "Public debt (internal, external, total)", geo_levels: ["country", "department", "national"], n_member_variables: 87, n_observations: 3052, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1822-1995", zeros_are_real: "sometimes" },
    public_employment_subnational: { display_name: "Public employment per capita (subnational)", geo_levels: ["department", "province"], n_member_variables: 1, n_observations: 444, per_capita_default: "default_raw", source_type: "external_academic", units: "rate", valid_years_pattern: "1865-1920", zeros_are_real: "never" },
    railways: { display_name: "Railways (ferrocarriles)", geo_levels: ["national"], n_member_variables: 26, n_observations: 100, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1860-1917", zeros_are_real: "sometimes" },
    real_income_sectoral: { display_name: "Real income by sector", geo_levels: ["country"], n_member_variables: 11, n_observations: 154, per_capita_default: "default_raw", source_type: "compiled", units: "currency_pesos_1995", valid_years_pattern: "1940-1983", zeros_are_real: "never" },
    religion_subnational: { display_name: "Religion subnational (Catholic, Protestant, Evangelical, Jewish, etc.)", geo_levels: ["country", "national", "province"], n_member_variables: 21, n_observations: 297, per_capita_default: "default_pc", source_type: "census", units: "count", valid_years_pattern: "1920-1970", zeros_are_real: "sometimes" },
    rural_urban_share_long_series: { display_name: "Rural/urban population share long series", geo_levels: ["country", "macro_region", "national", "province"], n_member_variables: 14, n_observations: 1811, per_capita_default: "default_raw", source_type: "compiled", units: "pct", valid_years_pattern: "1835-2000", zeros_are_real: "never" },
    school_enrollment_subnational: { display_name: "School enrollment (alumnos)", geo_levels: ["department", "national", "province"], n_member_variables: 8, n_observations: 492, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1822-1875", zeros_are_real: "never" },
    schools_count_subnational: { display_name: "Schools count (subnational)", geo_levels: ["department", "national", "province"], n_member_variables: 13, n_observations: 251, per_capita_default: "user_choice", source_type: "census", units: "count", valid_years_pattern: "1870-1920", zeros_are_real: "sometimes" },
    schools_subnational_monograph: { display_name: "Schools by department (count, enrollment, attendance, municipal and government subsidy)", geo_levels: ["nan"], n_member_variables: 0, n_observations: 0, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "nan", zeros_are_real: "never" },
    secondary_education_panel: { display_name: "Secondary education panel (students, schools by funder type and sex)", geo_levels: ["country", "national"], n_member_variables: 19, n_observations: 19, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1822-1900", zeros_are_real: "never" },
    social_spending: { display_name: "Government social spending (gasto_social_*, gasto_real, etc.)", geo_levels: ["country", "national", "province"], n_member_variables: 17, n_observations: 160, per_capita_default: "default_pc", source_type: "compiled", units: "currency_pesos", valid_years_pattern: "1842-2000", zeros_are_real: "sometimes" },
    state_capacity_1899_dept: { display_name: "Dept state capacity 1899 (school, justice, pworks, civilreg, etc.)", geo_levels: ["commune"], n_member_variables: 2, n_observations: 574, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1935-1935", zeros_are_real: "sometimes" },
    state_ministers_1865_1897: { display_name: "Ministerial budgets 1865-1897 (min_*)", geo_levels: ["national"], n_member_variables: 11, n_observations: 590, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1865-1897", zeros_are_real: "sometimes" },
    state_officials_named: { display_name: "Named state officials (governor, intendant, judge, postal)", geo_levels: ["department"], n_member_variables: 5, n_observations: 1049, per_capita_default: "not_applicable", source_type: "memoria", units: "count", valid_years_pattern: "1855-1908", zeros_are_real: "never" },
    state_owned_enterprises: { display_name: "State-owned enterprise share of sector", geo_levels: ["country"], n_member_variables: 7, n_observations: 13, per_capita_default: "default_raw", source_type: "compiled", units: "pct", valid_years_pattern: "1965-1972", zeros_are_real: "sometimes" },
    subnational_population_lowercase: { display_name: "Subnational population (lowercase Spanish: poblacion_*, hombres, mujeres)", geo_levels: ["commune", "country", "department", "national", "nationality", "province", "provincia", "religion"], n_member_variables: 143, n_observations: 5176, per_capita_default: "default_pc", source_type: "census", units: "count", valid_years_pattern: "1822-2000", zeros_are_real: "never" },
    subnational_population_titled: { display_name: "Subnational population, Spanish title-case columns", geo_levels: ["department", "national", "province"], n_member_variables: 47, n_observations: 2130, per_capita_default: "not_applicable", source_type: "census", units: "count", valid_years_pattern: "1811-2000", zeros_are_real: "never" },
    tariff_rates: { display_name: "Tariff rates", geo_levels: ["national"], n_member_variables: 2, n_observations: 283, per_capita_default: "default_raw", source_type: "compiled", units: "pct", valid_years_pattern: "1833-1995", zeros_are_real: "sometimes" },
    tax_landholding: { display_name: "Land tax: contribución, arrears, delinquency, compliance", geo_levels: ["department", "national", "province"], n_member_variables: 7, n_observations: 2398, per_capita_default: "user_choice", source_type: "compiled", units: "currency_pesos", valid_years_pattern: "1855-1970", zeros_are_real: "sometimes" },
    total_population_subnational: { display_name: "Total population (subnational)", geo_levels: ["commune", "country", "department", "national", "province", "provincia", "religion"], n_member_variables: 6, n_observations: 4028, per_capita_default: "not_applicable", source_type: "census", units: "count", valid_years_pattern: "1810-1995", zeros_are_real: "never" },
    trade_exports: { display_name: "Exports (trade)", geo_levels: ["national"], n_member_variables: 8, n_observations: 399, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1844-1924", zeros_are_real: "sometimes" },
    trade_imports: { display_name: "Imports (trade)", geo_levels: ["country", "national"], n_member_variables: 26, n_observations: 2650, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1810-1995", zeros_are_real: "sometimes" },
    trade_total_categorical: { display_name: "Total trade and trade categories", geo_levels: ["national", "port"], n_member_variables: 11, n_observations: 651, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1844-1914", zeros_are_real: "sometimes" },
    transport_1935_province: { display_name: "Transport 1935 province (vehicles, road km)", geo_levels: ["national", "province"], n_member_variables: 20, n_observations: 1865, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1860-1995", zeros_are_real: "sometimes" },
    unemployment_quarterly_sectoral: { display_name: "Unemployment by sector (quarterly, 1957-)", geo_levels: ["country"], n_member_variables: 931, n_observations: 931, per_capita_default: "default_pc", source_type: "compiled", units: "count", valid_years_pattern: "1956-1978", zeros_are_real: "sometimes" },
    urban_rural_population_subnational: { display_name: "Urban / rural population (subnational)", geo_levels: ["national", "province"], n_member_variables: 3, n_observations: 342, per_capita_default: "default_raw", source_type: "census", units: "count", valid_years_pattern: "1865-1992", zeros_are_real: "never" },
    urbanization_share: { display_name: "Urbanization share", geo_levels: ["country", "national", "province"], n_member_variables: 7, n_observations: 177, per_capita_default: "default_raw", source_type: "compiled", units: "pct", valid_years_pattern: "1895-1982", zeros_are_real: "never" },
    vital_statistics_1858_province: { display_name: "Vital statistics 1858 (births/deaths/marriages by province)", geo_levels: ["national", "province"], n_member_variables: 62, n_observations: 934, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1849-1948", zeros_are_real: "never" },
    vital_statistics_subnational: { display_name: "Vital statistics (registry)", geo_levels: ["department", "national", "province"], n_member_variables: 17, n_observations: 885, per_capita_default: "default_pc", source_type: "anuario", units: "count", valid_years_pattern: "1869-1920", zeros_are_real: "never" },
    wages_official: { display_name: "Official salaries (sueldos)", geo_levels: ["national"], n_member_variables: 1, n_observations: 9, per_capita_default: "user_choice", source_type: "memoria", units: "currency_pesos", valid_years_pattern: "1833-1841", zeros_are_real: "never" },
    wages_sectoral: { display_name: "Wages by economic sector (real / registered monthly)", geo_levels: ["country", "region"], n_member_variables: 27, n_observations: 423, per_capita_default: "default_raw", source_type: "compiled", units: "currency_pesos_1995", valid_years_pattern: "1940-2000", zeros_are_real: "never" },
};

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
