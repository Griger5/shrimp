<script setup lang="ts">
definePageMeta({
	middleware: ["authenticated"],
});

const { t, locale } = useI18n();
const { user, clear: clearSession } = useUserSession();

async function logout() {
	await clearSession();
	await navigateTo("/login");
}

const { data } = await useFetch("/api/images/list");
// const images = computed(() => data.value?.images ?? []);
const images = ref(data.value?.images ?? []);

const deletingId = ref<string | null>(null);

async function deleteImage(imageId: string) {
	if (!confirm(t("account.confirm_delete"))) return;

	try {
		deletingId.value = imageId;

		await $fetch("/api/images/url/", {
			method: "DELETE",
			body: { id: deletingId.value }
		});

		images.value = images.value.filter((img) => img.id !== imageId);
	}
	catch (error) {
		console.error(error);
		alert(t("account.delete_failed"));
	}
	finally {
		deletingId.value = null;
	}
}
</script>

<template>
	<div>
		<h1>{{ t("account.welcome") }} {{ user?.name }}</h1>

		<div class="results-container">
			<ul
				v-if="images.length"
				class="image-list"
			>
				<li
					v-for="item in images"
					:key="item.id"
					class="image-item"
				>
					<NuxtLink
						:to="{ path: '/image-editor', query: { image: item.id } }"
						class="image-link"
					>
						<img
							:src="item.url"
							:alt="`Image ${item.id}`"
							class="thumbnail"
						>
					</NuxtLink>
					<div class="row">
						<div>
							<NuxtLink
								:to="{ path: '/image-editor', query: { image: item.id } }"
								class="image-link"
							>
								<h3>{{ item.name }}</h3>
							</NuxtLink>
							<div class="created-at">
								{{ t("account.created_at") }}: {{ new Date(item.created_at).toLocaleString(locale) }}
							</div>
						</div>
						<button
							class="right"
							:disabled="deletingId === item.id"
							@click="deleteImage(item.id)"
						>
							{{ deletingId === item.id ? t("account.deleting") : t("account.delete") }}
						</button>
					</div>
				</li>
			</ul>
			<p v-else>
				{{ t("account.no_images") }}
			</p>
		</div>
		<br>
		<button @click="logout">
			{{ t("account.logout") }}
		</button>
	</div>
</template>

<style scoped>
.results-container {
	max-height: 500px;
	overflow-y: auto;
	border: 1px solid var(--pico-muted-border-color);
	border-radius: 6px;
	padding: 0.5rem;
}

.image-list {
	list-style: none;
	padding: 0;
	margin: 0;
}

.image-item {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.5rem 0;
	border-bottom: 1px solid var(--pico-muted-border-color);
}

.image-item:last-child {
	border-bottom: none;
}

.thumbnail {
	width: 100px;
	height: 100px;
	object-fit: cover;
	border-radius: 4px;
}

.created-at {
	font-size: 0.85rem;
	color: var(--pico-muted-text-color);
	display: inline;
	margin-right: auto;
}

.image-link {
	flex-shrink: 0;
	display: block;
}

.row {
	display: flex;
	align-items: center;
	flex: 1;
}

.right {
	margin-left: auto;
}
</style>
