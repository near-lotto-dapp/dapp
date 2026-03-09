use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, AccountId, Promise, PanicOnDefault, NearToken};
use near_sdk::serde::{Serialize, Deserialize};

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct WinnerInfo {
    pub account_id: AccountId,
    pub amount: String,
}

// history
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct DrawRecord {
    pub winner_id: AccountId,
    pub amount: String,
    pub timestamp_ms: u64,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
#[borsh(crate = "near_sdk::borsh")]
pub struct LotteryPool {
    pub next_draw_time_ms: u64,
    pub draw_period_ms: u64,
    pub owner_id: AccountId,
    pub tickets: Vec<AccountId>,
    pub total_pool: NearToken,
    pub last_winner: Option<WinnerInfo>,

    pub total_won_all_time: NearToken,
    pub total_fee_earned: NearToken,
    pub history: Vec<DrawRecord>,
}

#[near_bindgen]
impl LotteryPool {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        // 24 * 60 * 60 * 1000 = 86400000
        let draw_period_ms = 86400000;

        Self {
            owner_id,
            tickets: Vec::new(),
            total_pool: NearToken::from_near(0),
            last_winner: None,
            total_won_all_time: NearToken::from_near(0),
            total_fee_earned: NearToken::from_near(0),
            history: Vec::new(),
            // first deadline
            next_draw_time_ms: env::block_timestamp_ms() + draw_period_ms,
            draw_period_ms,
        }
    }

    pub fn draw_winner(&mut self) {
        self.assert_owner();
        let tickets_len = self.tickets.len();
        assert!(tickets_len > 0, "No tickets");

        let seed = env::random_seed();
        let mut seed_bytes = [0u8; 8];
        seed_bytes.copy_from_slice(&seed[0..8]);
        let random_index = u64::from_be_bytes(seed_bytes) as usize % tickets_len;
        let winner_id = self.tickets[random_index].clone();

        let total_yocto = self.total_pool.as_yoctonear();
        let fee_yocto = (total_yocto * 3) / 100;
        let winner_prize_yocto = total_yocto - fee_yocto;

        env::log_str("--- Lottery Draw Result ---");
        env::log_str(&format!("Total pool: {} yoctoNEAR", total_yocto));
        env::log_str(&format!("Treasure Fee (1%): {} yoctoNEAR", fee_yocto));
        env::log_str(&format!("Winner prize: {} yoctoNEAR", winner_prize_yocto));

        self.last_winner = Some(WinnerInfo {
            account_id: winner_id.clone(),
            amount: winner_prize_yocto.to_string(),
        });

        // update statistics and history
        self.total_won_all_time = self.total_won_all_time.saturating_add(NearToken::from_yoctonear(winner_prize_yocto));
        self.total_fee_earned = self.total_fee_earned.saturating_add(NearToken::from_yoctonear(fee_yocto));

        self.history.push(DrawRecord {
            winner_id: winner_id.clone(),
            amount: winner_prize_yocto.to_string(),
            timestamp_ms: env::block_timestamp_ms(),
        });

        Promise::new(winner_id).transfer(NearToken::from_yoctonear(winner_prize_yocto));
        Promise::new(self.owner_id.clone()).transfer(NearToken::from_yoctonear(fee_yocto));

        self.tickets.clear();
        self.total_pool = NearToken::from_near(0);

        // re-run timer
        self.next_draw_time_ms = env::block_timestamp_ms() + self.draw_period_ms;
    }

    pub fn get_global_stats(&self) -> (String, String) {
        (
            self.total_won_all_time.as_yoctonear().to_string(),
            self.total_fee_earned.as_yoctonear().to_string()
        )
    }

    pub fn get_draw_history(&self) -> String {
        serde_json::to_string(&self.history).unwrap()
    }

    pub fn get_next_draw_time(&self) -> u64 {
        self.next_draw_time_ms
    }

    #[payable]
    pub fn buy_tickets(&mut self) {
        let deposit = env::attached_deposit();
        let ticket_price = NearToken::from_millinear(100);
        let num_tickets = (deposit.as_yoctonear() / ticket_price.as_yoctonear()) as usize;

        for _ in 0..num_tickets {
            self.tickets.push(env::predecessor_account_id());
        }
        self.total_pool = self.total_pool.saturating_add(deposit);
    }

    pub fn get_last_winner(&self) -> String {
        match &self.last_winner {
            Some(winner) => serde_json::to_string(winner).unwrap(),
            None => "".to_string(),
        }
    }

    pub fn get_pool_info(&self) -> (usize, String) {
        (self.tickets.len(), self.total_pool.as_yoctonear().to_string())
    }

    fn assert_owner(&self) {
        assert_eq!(env::predecessor_account_id(), self.owner_id, "Owner only");
    }
}