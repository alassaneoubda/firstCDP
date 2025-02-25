let SESSIONID = null, PROFILEID = null;
const UNOMI_SERVER = "http://66.29.155.72:8181";

(function () {
    const unomiTrackerTestConf = {
        scope: "madata",
        site: { siteInfo: { siteID: "madata" } },
        page: {
            pageInfo: {
                pageID: "madata-page",
                pageName: document.title,
                pagePath: document.location.pathname,
                destinationURL: document.location.origin + document.location.pathname,
                language: "en",
                categories: [], tags: []
            },
            consentTypes: [],
        },
        events: [],
        wemInitConfig: {
            contextServerUrl: UNOMI_SERVER,
            timeoutInMilliseconds: "1500",
            contextServerCookieName: "context-profile-id",
            activateWem: true,
            trackerSessionIdCookieName: "madata-session-id",
            trackerProfileIdCookieName: "madata-profile-id",
        }
    };

    // Vérifier l’existence des cookies avant de les générer
    if (typeof unomiWebTracker !== "undefined" &&
        unomiWebTracker.getCookie(unomiTrackerTestConf.wemInitConfig.trackerSessionIdCookieName) == null) {
        unomiWebTracker.setCookie(
            unomiTrackerTestConf.wemInitConfig.trackerSessionIdCookieName,
            unomiWebTracker.generateGuid(),
            1
        );
    }

    // Initialisation du tracker
    unomiWebTracker.initTracker(unomiTrackerTestConf);

    // Récupération du contexte et activation des événements après chargement
    unomiWebTracker._registerCallback(() => {
        const context = unomiWebTracker.getLoadedContext();
        SESSIONID = context.sessionId;
        PROFILEID = context.profileId;
        console.log("SESSIONID : " + SESSIONID + ", PROFILEID : " + PROFILEID);

        $(document).ready(function () {
            handleFormSubmission();
            $(".pageVisit").click(function (e) {
                e.preventDefault();
                sendPageVisitEvent($(e.target).text().trim());
            });
        });

    }, "Unomi tracker test callback example");

    unomiWebTracker.startTracker();
})();

// Fonction d’envoi d’un événement de visite
function sendPageVisitEvent(pageVisit) {
    var customAppEvent = unomiWebTracker.buildEvent(
        "click",
        unomiWebTracker.buildTarget(pageVisit.toLowerCase() + "PageVisit", pageVisit),
        unomiWebTracker.buildSourcePage()
    );

    unomiWebTracker.collectEvent(
        customAppEvent,
        () => console.info(pageVisit + " click event successfully collected."),
        () => console.error("Could not send " + pageVisit + " click event.")
    );
}

// Gestion du formulaire
function handleFormSubmission() {
    document.getElementById("signupForm").addEventListener("submit", function(event) {
        event.preventDefault();

        const formData = {
            eventType: "contactInfoSubmitted",
            scope: "madata",
            source: { itemType: "site", scope: "madata", itemId: "mysite" },
            target: { itemType: "form", scope: "madata", itemId: "signupForm" },
            properties: {
                firstName: document.getElementById("firstName").value,
                lastName: document.getElementById("lastName").value,
                email: document.getElementById("email").value
            }
        };

        fetch(`${UNOMI_SERVER}/cxs/eventcollector`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: SESSIONID, events: [formData] })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP : ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Événement soumis :", data);
            document.getElementById("signupForm").reset();
        })
        .catch(error => {
            console.error("Erreur lors de l'envoi de l'événement :", error);
        });
    });
}
