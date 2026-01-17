<script setup lang="ts">
definePageMeta({
	middleware: ["authenticated"],
});

const { t } = useI18n();

const { user, clear: clearSession } = useUserSession();

async function logout() {
	await clearSession();
	await navigateTo("/login");
}

const { data } = await useFetch("/api/images/list");
const images = computed(() => data.value?.images ?? []);
</script>

<template>
	<div>
		<h1>{{ t("account.welcome") }} {{ user?.id }}</h1>
		<client-only>
		<div class="results-container">
			<ul>
				<li v-for="item in images" :key="item.id">
				<NuxtLink
					:to="{ path: '/image-editor', query: { image: item.id } }"
					class="result-link"
				>
					{{ item.created_at }}
				</NuxtLink>
				</li>
			</ul>
		</div>
		</client-only>
		<button @click="logout">
			Logout
		</button>
	</div>
</template>

<style scoped>
.results-container {
	height: 320px;
	overflow-y: auto;
	border: 1px solid var(--pico-muted-border-color);
	border-radius: 6px;
}

.result-link {
	display: block;
	padding: 0.75rem;
	text-decoration: none;
	color: inherit;
}

.result-link:hover {
	background: var(--pico-muted-background-color);
}
</style>