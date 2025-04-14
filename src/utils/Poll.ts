import type { PlayerSession } from "../player/PlayerSession";

/**
 * A poll is a collection of options that players can vote for.
 * It is used to collect feedback from players.
 * 
 * In the case of Among Cubes, it is used to vote for the impostor.
 */
export class Poll {

    private _voters: Map<string, string>; // The first string is the player username, the second string is the option they voted for
    private _options: string[]; // The options

    constructor(options: string[]) {
        this._voters = new Map();
        this._options = options;
    }

    // Returns an array with the most voted option, or the options with the same number of votes
    public getMostVotedOptions(): string[] {
        const voteCounts = this.getOptionsWithNumberOfVotes();
        
        // Find the highest vote count
        let maxVotes = 0;
        for (const count of voteCounts.values()) {
            if (count > maxVotes) {
                maxVotes = count;
            }
        }

        // Get all options with the highest vote count
        const mostVotedOptions: string[] = [];
        for (const [option, count] of voteCounts.entries()) {
            if (count === maxVotes) {
                mostVotedOptions.push(option);
            }
        }

        return mostVotedOptions;
    }

    // Returns a map with the options as keys and the number of votes as values
    public getOptionsWithNumberOfVotes(): Map<string, number> {
        const voteCounts = new Map<string, number>();

        // Count votes for each option
        for (const vote of this._voters.values()) {
            voteCounts.set(vote, (voteCounts.get(vote) || 0) + 1);
        }

        return voteCounts;
    }

    // Returns true if the player has voted
    public hasVoted(voter: PlayerSession): boolean {
        return this._voters.has(voter.getPlayer().username);
    }

    // Votes for an option
    public vote(voter: PlayerSession, option: string): void {
        if (!this._options.includes(option)) {
            throw new Error(`Option ${option} is not a valid option`);
        }

        this._voters.set(voter.getPlayer().username, option);
    }

}