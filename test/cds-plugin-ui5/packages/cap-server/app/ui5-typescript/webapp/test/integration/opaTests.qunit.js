sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'ui5typescript/test/integration/FirstJourney',
		'ui5typescript/test/integration/pages/ListOfBooksList',
		'ui5typescript/test/integration/pages/ListOfBooksObjectPage',
		'ui5typescript/test/integration/pages/Books_textsObjectPage'
    ],
    function(JourneyRunner, opaJourney, ListOfBooksList, ListOfBooksObjectPage, Books_textsObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('ui5typescript') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheListOfBooksList: ListOfBooksList,
					onTheListOfBooksObjectPage: ListOfBooksObjectPage,
					onTheBooks_textsObjectPage: Books_textsObjectPage
                }
            },
            opaJourney.run
        );
    }
);