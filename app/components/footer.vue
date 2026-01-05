<script setup lang="ts">
const { t, locale, loadLocaleMessages, availableLocales } = useI18n({ useScope: "global" });

const setLocale = async () => {
	await loadLocaleMessages(locale.value);
};
</script>

<template>
	<footer class="container">
		<hr>

		<div class="footer-content">
			<small>
				{{ new Date().getFullYear() }} MyApp. All rights reserved.
			</small>

			<div class="locale-switcher">
				<label for="locale">
					Language
					<select
						id="locale"
						v-model="locale"
						@change="setLocale"
					>
						<option
							v-for="code in availableLocales"
							:key="code"
							:value="code"
						>
							{{ code }}
						</option>
					</select>
				</label>
			</div>
		</div>
	</footer>
</template>

<style scoped>
.footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.locale-switcher {
    max-width: 200px;
}

footer {
    margin-top: 4rem;
}
</style>
