App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    admin: '0x0',
    hasVoted: false,
    electionStarted: false,
    electionEnded: false,

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }
        return App.initContract();
    },

    initContract: function () {
        $.getJSON("Election.json", function (election) {
            App.contracts.Election = TruffleContract(election);
            App.contracts.Election.setProvider(App.web3Provider);
            return App.render();
        });
    },

    render: function () {
        var electionInstance;
        var loader = $("#loader");
        var content = $("#content");

        loader.show();
        content.hide();

        // Load account data
        web3.eth.getCoinbase(function (err, account) {
            if (err === null) {
                App.account = account;
                $("#accountAddress").html(
                    "<span id='accountTag'>Your Account :</span> <span id='myAccount'>" + account + "</span>"
                );
            }
        });

        // Load contract data
        App.contracts.Election.deployed().then(function (instance) {
            electionInstance = instance;
            return electionInstance.admin();
        }).then(function (adminAddress) {
            App.admin = adminAddress;
            
            // Check if current account is admin
            if (App.account.toLowerCase() === App.admin.toLowerCase()) {
                $("#adminPanel").show();
            } else {
                $("#adminPanel").hide();
            }
            
            // Get election status
            return electionInstance.getElectionStatus();
        }).then(function (status) {
            App.electionStarted = status[0];
            App.electionEnded = status[1];
            
            // Update status display
            App.updateElectionStatus();
            
            return electionInstance.candidatesCount();
        }).then(function (candidatesCount) {
            var candidatesResults = $("#candidatesResults");
            candidatesResults.empty();

            var candidatesSelect = $('#candidatesSelect');
            candidatesSelect.empty();

            for (var i = 1; i <= candidatesCount; i++) {
                electionInstance.candidates(i).then(function (candidate) {
                    var id = candidate[0];
                    var name = candidate[1];
                    var voteCount = candidate[2];

                    // Render candidate Result
                    var candidateTemplate = "<tr><td>" + id + "</td><td>" + name + "</td><td>" + voteCount + "</td></tr>";
                    candidatesResults.append(candidateTemplate);

                    // Render candidate ballot option
                    var candidateOption = "<option value='" + id + "'>" + name + "</option>";
                    candidatesSelect.append(candidateOption);
                });
            }
            
            return electionInstance.voters(App.account);
        }).then(function (hasVoted) {
            App.hasVoted = hasVoted;
            
            // Show/hide voting form based on election status and vote status
            if (!App.electionStarted || App.electionEnded) {
                $('form').hide();
                if (App.electionEnded) {
                    $("#electionClosedStatus").show();
                } else {
                    $("#electionNotStartedStatus").show();
                }
            } else if (App.hasVoted) {
                $('form').hide();
                $("#voteStatus").show();
            } else {
                $('form').show();
                $("#voteStatus").hide();
                $("#electionClosedStatus").hide();
                $("#electionNotStartedStatus").hide();
            }
            
            loader.hide();
            content.show();
        }).catch(function (error) {
            console.warn(error);
        });
    },

    updateElectionStatus: function () {
        var statusHtml = "<strong>Election Status:</strong> ";
        
        if (!App.electionStarted) {
            statusHtml += "<span style='color: red;'>Not Started</span>";
        } else if (App.electionEnded) {
            statusHtml += "<span style='color: red;'>Ended</span>";
        } else {
            statusHtml += "<span style='color: green;'>Active</span>";
        }
        
        $("#electionStatus").html(statusHtml);
    },

    castVote: function () {
        if (!App.electionStarted) {
            alert("Election has not started yet!");
            return false;
        }
        
        if (App.electionEnded) {
            alert("Election has ended!");
            return false;
        }
        
        var candidateId = $('#candidatesSelect').val();
        App.contracts.Election.deployed().then(function (instance) {
            return instance.vote(candidateId, { from: App.account });
        }).then(function (result) {
            $("#content").hide();
            $("#loader").show();
            // Reload after a short delay
            setTimeout(function() {
                App.render();
            }, 1000);
        }).catch(function (err) {
            console.error(err);
            alert("Error casting vote: " + err.message);
        });
        
        return false;
    },

    startElection: function () {
        if (App.account.toLowerCase() !== App.admin.toLowerCase()) {
            alert("Only admin can start the election!");
            return false;
        }
        
        App.contracts.Election.deployed().then(function (instance) {
            return instance.startElection({ from: App.account });
        }).then(function (result) {
            alert("Election started successfully!");
            setTimeout(function() {
                App.render();
            }, 1000);
        }).catch(function (err) {
            console.error(err);
            alert("Error starting election: " + err.message);
        });
        
        return false;
    },

    endElection: function () {
        if (App.account.toLowerCase() !== App.admin.toLowerCase()) {
            alert("Only admin can end the election!");
            return false;
        }
        
        App.contracts.Election.deployed().then(function (instance) {
            return instance.endElection({ from: App.account });
        }).then(function (result) {
            alert("Election ended successfully!");
            setTimeout(function() {
                App.render();
            }, 1000);
        }).catch(function (err) {
            console.error(err);
            alert("Error ending election: " + err.message);
        });
        
        return false;
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
