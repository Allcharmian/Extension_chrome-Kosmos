// Constantes
const ACTION_TERMS = {
    "OnSuccess": "OnSuccess",
    "HIDE": "HIDE",
    "BLOCK": "BLOCK",
    "UNBLOCK": "UNBLOCK",
    "SHOW": "SHOW"
};

const SET_PATTERN = /(simpleVariables|complexVariables)\.set\(\s*['"](.*?)['"]\s*,\s*(.*?)\s*\)/g;
const MODIFY_PATTERN = /(simpleVariables|complexVariables)\.modify\(\s*['"](.*?)['"]\s*,\s*(.*?)\s*\)/g;
const GET_PATTERN = /const\s+(\w+)\s*:\s*(\w+)\s*=\s*_json\.get\(\s*['"](.*?)['"]\s*\)(?:\.get\(\s*['"](.*?)['"]\s*\))?;/g;

const FIELDS_TO_REMOVE = [
    'position', 'top', 'left', 'width', 'minWidth', 'height',
    'zIndex', 'minHeight', 'responsiveHidden', 'subOrder',
    'fieldId', 'FIELD', 'attemptsToGetContractGenerated', 'componentType', 'validatePreviousFieldsAndActions',
    'blockFields', 'blockWhileProcessing', 'blockFields', 'specificationId',
    'specification', 'businessLogicRelationship', 'componentKey', 'stringFunctionPreview'
];

// Inicialización de eventos
document.addEventListener('DOMContentLoaded', function () {
    // Eventos de video
    document.getElementById("mostrarVideo").addEventListener("click", function () {
        document.getElementById("miVideo").style.display = "block";
        document.getElementById("mostrarVideo").style.display = "none";
        document.getElementById("ocultarVideo").style.display = "block";
    });

    document.getElementById("ocultarVideo").addEventListener("click", function () {
        document.getElementById("mostrarVideo").style.display = "block";
        document.getElementById("miVideo").style.display = "none";
        document.getElementById("ocultarVideo").style.display = "none";
    });

    // Evento para mostrar formulario
    document.getElementById("nombrePaginaEstatus").addEventListener("click", function () {
        document.getElementById("formularioBase").style.display = "block";
        document.getElementById("nombrePaginaEstatus").style.display = "none";
        document.getElementById("mostrarVideo").style.display = "none";
        document.getElementById("miVideo").style.display = "none";
        document.getElementById("ocultarVideo").style.display = "none";
        document.getElementById("documento").style.display = "block";
    });

    // Evento para el formulario
    document.getElementById("mainForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const nombre = document.getElementById('outputName');
        const Flujo = document.getElementById('formFlujo');
        const Pagina = document.getElementById('formPagina');
        const Estatus = document.getElementById('formEstatus');
        const Seccion = document.getElementById('formSeccion');

        if (nombre.value.length === 0 || Flujo.value.length === 0 ||
            Pagina.value.length === 0 || Estatus.value.length === 0 ||
            Seccion.value.length === 0) {
            showStatus("Necesitas llenar todo el formulario", true);
            document.getElementById('status').style.color = 'red';
            return;
        }
        document.getElementById("outputName").disabled = true;
        document.getElementById("formFlujo").disabled = true;
        document.getElementById("formPagina").disabled = true;
        document.getElementById("formEstatus").disabled = true;
        document.getElementById("formSeccion").disabled = true;
        document.getElementById("processBtn").style.display = "block";
        document.getElementById("ContinuarBtn").style.display = "none";
    });

    // Evento para procesar archivos
    document.getElementById('processBtn').addEventListener('click', processMultipleFiles);
});

// Funciones auxiliares
function showStatus(message, isError = false) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = isError ? 'error' : 'success';
    statusDiv.style.display = 'block';
}

function removeSpecificFields(data, fieldName) {
    if (typeof data !== 'object' || data === null) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => removeSpecificFields(item, fieldName)).filter(item => item !== fieldName);
    }

    const result = {};
    for (const key in data) {
        if (key !== fieldName) {
            result[key] = removeSpecificFields(data[key], fieldName);
        }
    }
    return result;
}

function cleanData(data) {
    let cleanedData = data;
    FIELDS_TO_REMOVE.forEach(field => {
        cleanedData = removeSpecificFields(cleanedData, field);
    });
    return cleanedData;
}

function transformJsonToTable(data) {
    if (typeof data !== 'object' || data === null) {
        showStatus("Los datos de entrada deben ser un objeto", true);
        return null;
    }

    if (!('businessLogicList' in data) || !('componentList' in data)) {
        showStatus("Faltan claves requeridas en los datos de entrada", true);
        return null;
    }

    const formFlujo = document.getElementById('formFlujo');
    const formPagina = document.getElementById('formPagina');
    const formEstatus = document.getElementById('formEstatus');

    const rows = [];

    try {
        // Procesar businessLogicList
        data.businessLogicList.forEach(bl => {
            const row = {
                "FLUJO": formFlujo.value || "No disponible",
                "PAGINA": formPagina.value || "No disponible",
                "ESTATUS": formEstatus.value || "No disponible",
                "COMPONENTE": bl.event || "No disponible",
                "TITULO COMPONENTE": bl.event || "No disponible",
                "ACCION": ACTION_TERMS[bl.event] || "No disponible",
                "BL": bl.key || "No disponible",
                "NODO": bl.key || "No disponible",
                "VARIABLE": "No disponible",
                "PARAMETRO UNO": "No disponible",
                "PARAMETRO DOS": "No disponible",
                "SET o MODIFY": "No disponible",
                "CODIGO": bl.validatePreviousFieldsAndActions || "No disponible"
            };
            rows.push(row);
        });

        // Procesar componentList
        data.componentList.forEach(comp => {
            const tipoVarList = [];
            const parametrosList = [];
            const parametros2List = [];
            const opcionDeList = [];

            const meta = comp.meta || {};
            const codeSection = meta.stringFunction || "";

            // Procesar coincidencias
            let setMatch;
            while ((setMatch = SET_PATTERN.exec(codeSection)) !== null) {
                tipoVarList.push(setMatch[1]);
                parametrosList.push(setMatch[2]);
                parametros2List.push(setMatch[3]);
                opcionDeList.push('set');
            }

            SET_PATTERN.lastIndex = 0; // Reset regex

            let modifyMatch;
            while ((modifyMatch = MODIFY_PATTERN.exec(codeSection)) !== null) {
                tipoVarList.push(modifyMatch[1]);
                parametrosList.push(modifyMatch[2]);
                parametros2List.push(modifyMatch[3]);
                opcionDeList.push('modify');
            }

            MODIFY_PATTERN.lastIndex = 0; // Reset regex

            let getMatch;
            while ((getMatch = GET_PATTERN.exec(codeSection)) !== null) {
                tipoVarList.push(getMatch[1]);
                parametrosList.push(getMatch[2]);
                parametros2List.push(getMatch[3]);
                opcionDeList.push('get');
            }

            GET_PATTERN.lastIndex = 0; // Reset regex

            if (tipoVarList.length === 0) {
                rows.push({
                    "FLUJO": formFlujo.value || "No disponible",
                    "PAGINA": formPagina.value || "No disponible",
                    "ESTATUS": formEstatus.value || "No disponible",
                    "COMPONENTE": comp.component || "No disponible",
                    "TITULO COMPONENTE": meta.title || "No disponible",
                    "ACCION": meta.title || "No disponible",
                    "BL": comp.componentKeyGenerated || "No disponible",
                    "NODO": comp.componentKeyGenerated || "No disponible",
                    "VARIABLE": "No disponible",
                    "PARAMETRO UNO": "No disponible",
                    "PARAMETRO DOS": "NO disponible",
                    "SET o MODIFY": "No disponible",
                    "CODIGO": "No disponible"
                });
            } else {
                for (let i = 0; i < tipoVarList.length; i++) {
                    rows.push({
                        "FLUJO": formFlujo.value || "No disponible",
                        "PAGINA": formPagina.value || "No disponible",
                        "ESTATUS": formEstatus.value || "No disponible",
                        "COMPONENTE": comp.component || "No disponible",
                        "TITULO COMPONENTE": meta.title || "No disponible",
                        "ACCION": "No disponible",
                        "BL": comp.componentKeyGenerated || "No disponible",
                        "NODO": comp.componentKeyGenerated || "No disponible",
                        "VARIABLE": tipoVarList[i],
                        "PARAMETRO UNO": parametrosList[i],
                        "PARAMETRO DOS": parametros2List[i],
                        "SET o MODIFY": opcionDeList[i],
                        "CODIGO": "No disponible"
                    });
                }
            }
        });

        return rows;
    } catch (e) {
        showStatus(`Error procesando datos: ${e.message}`, true);
        return null;
    }
}

function convertToCSV(data) {
    if (!data || data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [];

    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + row[header]).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

async function processMultipleFiles() {
    const fileInput = document.getElementById('jsonFiles');
    const outputNameInput = document.getElementById('outputName');
    const combineFiles = document.getElementById('combineFiles').checked;
    const formFlujo = document.getElementById('formFlujo');
    const formPagina = document.getElementById('formPagina');
    const formEstatus = document.getElementById('formEstatus');
    const formSeccion = document.getElementById('formSeccion');

    if (fileInput.files.length === 0) {
        showStatus("Por favor selecciona al menos un archivo JSON", true);
        return;
    }

    hideErrorReport();
    const baseName = `${formFlujo.value}_${formPagina.value}_${formEstatus.value}_${formSeccion.value}_${outputNameInput.value.trim() || "salida"}`;
    const files = Array.from(fileInput.files);
    let allData = [];
    let processedCount = 0;
    const errorReports = [];

    showStatus(`Procesando ${files.length} archivos...`);

    try {
        for (const [index, file] of files.entries()) {
            try {
                const fileContent = await readFileAsText(file);

                if (!fileContent.trim().startsWith('{') && !fileContent.trim().startsWith('[')) {
                    throw new Error("El archivo no parece ser un JSON válido");
                }

                const jsonData = JSON.parse(fileContent);
                const cleanedData = cleanData(jsonData);
                const tableData = transformJsonToTable(cleanedData);

                if (!tableData || tableData.length === 0) {
                    throw new Error("No se pudo transformar el JSON a tabla (estructura no reconocida)");
                }

                if (combineFiles) {
                    allData.push(...tableData);
                } else {
                    const csvContent = convertToCSV(tableData);
                    let fileName = `${baseName.replace('.csv', '')}.csv`;
                    await downloadCSV(csvContent, fileName);
                }

                processedCount++;
                showStatus(`Procesados ${processedCount}/${files.length} archivos...`);
            } catch (e) {
                console.error(`Error procesando ${file.name}:`, e);
                errorReports.push({
                    fileName: file.name,
                    message: e.message || "Error desconocido"
                });
                showStatus(`Error en ${file.name} (ver detalles abajo)`, true);
            }
        }

        if (errorReports.length > 0) {
            showErrorReport(errorReports);
        }

        if (combineFiles && allData.length > 0) {
            const csvContent = convertToCSV(allData);
            const fileName = baseName.endsWith('.csv') ? baseName : `${baseName}.csv`;
            await downloadCSV(csvContent, fileName);
        }

        const successMessage = `Proceso completado. ${processedCount}/${files.length} archivos procesados correctamente.`;
        if (errorReports.length > 0) {
            showStatus(`${successMessage} ${errorReports.length} con errores.`, true);
        } else {
            showStatus(successMessage);
        }
    } catch (e) {
        showStatus(`Error general: ${e.message}`, true);
        console.error(e);
    }
}

async function downloadCSV(csvContent, fileName) {
    try {
        if (!fileName.endsWith('.csv')) {
            fileName += '.csv';
        }

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        await chrome.downloads.download({
            url: url,
            filename: fileName,
            conflictAction: 'uniquify'
        });

        setTimeout(() => URL.revokeObjectURL(url), 3000);

        return true;
    } catch (error) {
        console.error('Error al descargar:', error);
        return false;
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
}

function showErrorReport(errors) {
    const errorReport = document.getElementById('errorReport');
    const errorList = document.getElementById('errorList');

    errorList.innerHTML = '';

    errors.forEach(error => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${error.fileName}</strong>: ${error.message}`;
        errorList.appendChild(li);
    });

    errorReport.style.display = 'block';
}

function hideErrorReport() {
    document.getElementById('errorReport').style.display = 'none';
}