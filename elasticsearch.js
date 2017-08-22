var elasticsearch = require('elasticsearch');

var elasticClient = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'info',
});

// var indexName = "randomindex";

/**
* Delete an existing index
*/
function deleteIndex(indexName) {
    return elasticClient.indices.delete({
        index: indexName
    });
}
exports.deleteIndex = deleteIndex;


// /**
// * check if the index exists
// */
function indexExists(indexName) {
    return elasticClient.indices.exists({
        index: indexName
    });
}
exports.indexExists = indexExists;

/**
* create the index
*/
function initIndex(indexName) {
    return elasticClient.indices.create({
        index: indexName
    });
}
exports.initIndex = initIndex;

function initMapping(indexName, properties) {
    return elasticClient.indices.putMapping({
        index: indexName,
        type: indexName,
        body: {
            properties: {
                ...properties,
                suggest: {
                    type: "completion",
                    analyzer: "simple",
                    search_analyzer: "simple"
                }
            }
        }
    });
}
exports.initMapping = initMapping;
function addDocument(document, indexName) {
    return elasticClient.index({
        index: indexName,
        type: indexName,
        body: {
            ...document,
            suggest: {
                input: Object.keys(document).reduce((acc, val) => {
                  acc = acc + document[val];
                  return acc;
                }, '').split(" ").filter(x => !!x)
            }
        }
    });
}
exports.addDocument = addDocument;

function getSuggestions(input, indexName) {
    return elasticClient.suggest({
        index: indexName,
        body: {
            docsuggest: {
                text: input,
                completion: {
                    field: "suggest",
                    fuzzy: true
                }
            }
        }
    })
}
exports.getSuggestions = getSuggestions;