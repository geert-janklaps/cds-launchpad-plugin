sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'listofbooks',
            componentId: 'Books_textsObjectPage',
            contextPath: '/ListOfBooks/texts'
        },
        CustomPageDefinitions
    );
});