module.exports = async function (context, req) {
    context.log('Test function processed a request.');

    context.res = {
        status: 200,
        body: 'Test function works!'
    };
};