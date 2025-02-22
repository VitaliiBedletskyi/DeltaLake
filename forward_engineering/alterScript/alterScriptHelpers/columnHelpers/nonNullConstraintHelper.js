const {generateFullEntityName, prepareName} = require("../../../utils/general");
const {AlterScriptDto} = require("../../types/AlterScriptDto");


/**
 * @return {(collection: Object) => Array<AlterScriptDto>}
 * */
const getModifyNonNullColumnsScriptDtos = (_, ddlProvider) => (collection) => {
    const fullTableName = generateFullEntityName(collection);

    const currentRequiredColumnNames = collection.required || [];
    const previousRequiredColumnNames = collection.role.required || [];

    const columnNamesToAddNotNullConstraint = _.difference(currentRequiredColumnNames, previousRequiredColumnNames);
    const columnNamesToRemoveNotNullConstraint = _.difference(previousRequiredColumnNames, currentRequiredColumnNames);

    const addNotNullConstraintsScriptDtos = _.toPairs(collection.properties)
        .filter(([name, jsonSchema]) => {
            const oldName = jsonSchema.compMod.oldField.name;
            const shouldRemoveForOldName = columnNamesToRemoveNotNullConstraint.includes(oldName);
            const shouldAddForNewName = columnNamesToAddNotNullConstraint.includes(name);
            return shouldAddForNewName && !shouldRemoveForOldName;
        })
        .map(([columnName]) => ddlProvider.setNotNullConstraint(fullTableName, prepareName(columnName)))
        .map(script => AlterScriptDto.getInstance([script], true, false))
        .filter(Boolean);
    const removeNotNullConstraintScriptDtos = _.toPairs(collection.properties)
        .filter(([name, jsonSchema]) => {
            const oldName = jsonSchema.compMod.oldField.name;
            const shouldRemoveForOldName = columnNamesToRemoveNotNullConstraint.includes(oldName);
            const shouldAddForNewName = columnNamesToAddNotNullConstraint.includes(name);
            return shouldRemoveForOldName && !shouldAddForNewName;
        })
        .map(([name]) => ddlProvider.dropNotNullConstraint(fullTableName, prepareName(name)))
        .map(script => AlterScriptDto.getInstance([script], true, true))
        .filter(Boolean);

    return [...addNotNullConstraintsScriptDtos, ...removeNotNullConstraintScriptDtos];
}

module.exports = {
    getModifyNonNullColumnsScriptDtos,
}
