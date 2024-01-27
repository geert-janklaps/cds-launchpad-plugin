sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'listofbooks/test/integration/FirstJourney',
		'listofbooks/test/integration/pages/ListOfBooksList',
		'listofbooks/test/integration/pages/ListOfBooksObjectPage',
		'listofbooks/test/integration/pages/Books_textsObjectPage'
    ],
    function(JourneyRunner, opaJourney, ListOfBooksList, ListOfBooksObjectPage, Books_textsObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('listofbooks') + '/index.html'
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