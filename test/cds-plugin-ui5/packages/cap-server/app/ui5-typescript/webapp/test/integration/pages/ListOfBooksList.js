sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'ui5typescript',
            componentId: 'ListOfBooksList',
            contextPath: '/ListOfBooks'
        },
        CustomPageDefinitions
    );
});